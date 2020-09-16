import type {CodeKeywordDefinition, Schema} from "../../types"
import type KeywordCxt from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"

const def: CodeKeywordDefinition = {
  keyword: "allOf",
  schemaType: "array",
  code(cxt: KeywordCxt) {
    const {gen, schema, it} = cxt
    if (!Array.isArray(schema)) throw new Error("ajv implementation error")
    const valid = gen.name("valid")
    schema.forEach((sch: Schema, i: number) => {
      if (alwaysValidSchema(it, sch)) return
      applySubschema(it, {keyword: "allOf", schemaProp: i}, valid)
      cxt.ok(valid)
    })
  },
}

module.exports = def
