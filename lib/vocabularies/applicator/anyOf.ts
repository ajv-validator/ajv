import type {CodeKeywordDefinition, AnySchema} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, not} from "../../compile/codegen"
import {
  alwaysValidSchema,
  mergeEvaluatedPropsToName,
  mergeEvaluatedItemsToName,
} from "../../compile/util"

const def: CodeKeywordDefinition = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: true,
  code(cxt: KeywordCxt) {
    const {gen, schema, it} = cxt
    /* istanbul ignore if */
    if (!Array.isArray(schema)) throw new Error("ajv implementation error")
    const alwaysValid = schema.some((sch: AnySchema) => alwaysValidSchema(it, sch))
    if (alwaysValid && !it.opts.unevaluated) return

    const valid = gen.let("valid", false)
    const schValid = gen.name("_valid")

    gen.block(() =>
      schema.forEach((_sch: AnySchema, i: number) => {
        const schCxt = cxt.subschema(
          {
            keyword: "anyOf",
            schemaProp: i,
            compositeRule: true,
          },
          schValid
        )
        gen.assign(valid, _`${valid} || ${schValid}`)
        if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
          gen.if(schValid, () => {
            if (schCxt.props !== undefined && it.props !== true) {
              it.props = mergeEvaluatedPropsToName(gen, schCxt.props, it.props)
            }
            if (schCxt.items !== undefined && it.items !== true) {
              it.items = mergeEvaluatedItemsToName(gen, schCxt.items, it.items)
            }
          })
        } else {
          // can short-circuit if `unevaluatedProperties` is not supported (opts.next === false)
          // or if all properties were evaluated (it.props === true)
          gen.if(not(valid))
        }
      })
    )

    cxt.result(
      valid,
      () => cxt.reset(),
      () => cxt.error(true)
    )
  },
  error: {
    message: "should match some schema in anyOf",
  },
}

export default def
