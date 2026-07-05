import type {
  CodeKeywordDefinition,
  ErrorObject,
  KeywordErrorDefinition,
  AnySchema,
} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import {_, Name} from "../../compile/codegen"
import {alwaysValidSchema} from "../../compile/util"
import {SchemaCxt} from "../../compile"

export type OneOfError = ErrorObject<
  "oneOf",
  {passingSchemas: [number, number] | null},
  AnySchema[]
>

const error: KeywordErrorDefinition = {
  message: "must match exactly one schema in oneOf",
  params: ({params}) => _`{passingSchemas: ${params.passing}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: true,
  error,
  code(cxt: KeywordCxt) {
    const {gen, schema, parentSchema, it} = cxt
    /* istanbul ignore if */
    if (!Array.isArray(schema)) throw new Error("ajv implementation error")
    if (it.opts.discriminator && parentSchema.discriminator) return
    const schArr: AnySchema[] = schema
    const valid = gen.let("valid", false)
    const passing = gen.let("passing", null)
    const schValid = gen.name("_valid")
    cxt.setParams({passing})
    // TODO possibly fail straight away (with warning or exception) if there are two empty always valid schemas

    gen.block(validateOneOf)

    cxt.result(
      valid,
      () => cxt.reset(),
      () => cxt.error(true)
    )

    function validateOneOf(): void {
      // Emit a flat sequence of `if` blocks (one per variant, all at the same
      // nesting level) instead of nesting each variant inside the previous one's
      // `else`. A nested else-chain grows O(N) deep, which overflows the call
      // stack both while rendering the code and while running the generated
      // validator for large `oneOf` arrays (#2641). `valid` tracks "exactly one
      // matched so far" and `passing` records the matching index (or the first
      // conflicting pair). Once a second variant matches, `oneOf` has already
      // failed, so the remaining variants are guarded out at run time to keep
      // the same short-circuit behaviour (and error output) as before.
      schArr.forEach((sch: AnySchema, i: number) => {
        const evalVariant = (): void => {
          let schCxt: SchemaCxt | undefined
          if (alwaysValidSchema(it, sch)) {
            gen.var(schValid, true)
          } else {
            schCxt = cxt.subschema(
              {
                keyword: "oneOf",
                schemaProp: i,
                compositeRule: true,
              },
              schValid
            )
          }
          gen.if(schValid, () => {
            // `mergeEvaluated` must only run for the first matching variant
            // (`passing === null`). Merging on a later, conflict-causing match
            // would mark that variant's properties/items as evaluated, which is
            // wrong once `oneOf` has failed. This matches the stock nested-else
            // codegen, where the conflicting branch's merge site never executes.
            gen.if(
              _`${passing} === null`,
              () => {
                gen.assign(valid, true).assign(passing, i)
                if (schCxt) cxt.mergeEvaluated(schCxt, Name)
              },
              () =>
                gen.if(valid, () => gen.assign(valid, false).assign(passing, _`[${passing}, ${i}]`))
            )
          })
        }
        if (i > 1) {
          gen.if(_`${valid} || ${passing} === null`, evalVariant)
        } else {
          evalVariant()
        }
      })
    }
  },
}

export default def
