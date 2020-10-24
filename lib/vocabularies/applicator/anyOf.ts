import type {CodeKeywordDefinition, AnySchema} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, not} from "../../compile/codegen"
import {alwaysValidSchema} from "../../compile/util"

const def: CodeKeywordDefinition = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: true,
  code(cxt: KeywordCxt) {
    const {gen, schema, it} = cxt
    /* istanbul ignore if */
    if (!Array.isArray(schema)) throw new Error("ajv implementation error")
    const alwaysValid = schema.some((sch: AnySchema) => alwaysValidSchema(it, sch))
    if (alwaysValid) return

    const valid = gen.let("valid", false)
    const schValid = gen.name("_valid")

    gen.block(() => {
      schema.forEach((_sch: AnySchema, i: number) => {
        cxt.subschema(
          {
            keyword: "anyOf",
            schemaProp: i,
            compositeRule: true,
          },
          schValid
        )
        gen.assign(valid, _`${valid} || ${schValid}`)
        gen.if(not(valid))
      })
    }, schema.length)

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
