import type {CodeKeywordDefinition, AnySchema} from "../../types"
import type KeywordCxt from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {_} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: true,
  code(cxt: KeywordCxt) {
    const {gen, schema, it} = cxt
    if (!Array.isArray(schema)) throw new Error("ajv implementation error")
    const alwaysValid = schema.some((sch: AnySchema) => alwaysValidSchema(it, sch))
    if (alwaysValid) return

    const valid = gen.let("valid", false)
    const schValid = gen.name("_valid")

    gen.block(() => {
      schema.forEach((_sch: AnySchema, i: number) => {
        applySubschema(
          it,
          {
            keyword: "anyOf",
            schemaProp: i,
            compositeRule: true,
          },
          schValid
        )
        gen.assign(valid, _`${valid} || ${schValid}`)
        gen.ifNot(valid)
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

module.exports = def
