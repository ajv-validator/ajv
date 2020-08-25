import {CodeKeywordDefinition} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"

const def: CodeKeywordDefinition = {
  keyword: "allOf",
  schemaType: "array",
  code({gen, ok, schema, it}) {
    const valid = gen.name("valid")
    schema.forEach((sch: object | boolean, i: number) => {
      if (alwaysValidSchema(it, sch)) return
      applySubschema(it, {keyword: "allOf", schemaProp: i}, valid)
      ok(valid)
    })
    // TODO possibly add allOf error
  },
}

module.exports = def
