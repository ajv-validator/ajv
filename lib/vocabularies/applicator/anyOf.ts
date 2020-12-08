import type {CodeKeywordDefinition, ErrorNoParams, AnySchema} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, not} from "../../compile/codegen"
import {alwaysValidSchema} from "../../compile/util"

export type AnyOfError = ErrorNoParams<"anyOf", AnySchema[]>

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
        const merged = cxt.mergeValidEvaluated(schCxt, schValid)
        // can short-circuit if `unevaluatedProperties/Items` not supported (opts.unevaluated !== true)
        // or if all properties and items were evaluated (it.props === true && it.items === true)
        if (!merged) gen.if(not(valid))
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
