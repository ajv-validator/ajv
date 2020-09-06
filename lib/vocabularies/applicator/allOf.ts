import {CodeKeywordDefinition} from "../../types"
import KeywordCtx from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"

const def: CodeKeywordDefinition = {
  keyword: "allOf",
  schemaType: "array",
  code(cxt: KeywordCtx) {
    const {gen, schema, it} = cxt
    const valid = gen.name("valid")
    schema.forEach((sch: object | boolean, i: number) => {
      if (alwaysValidSchema(it, sch)) return
      applySubschema(it, {keyword: "allOf", schemaProp: i}, valid)
      cxt.ok(valid)
    })
  },
}

module.exports = def
