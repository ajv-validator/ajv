import {CodeKeywordDefinition} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"

const def: CodeKeywordDefinition = {
  keyword: "allOf",
  schemaType: "array",
  code({gen, ok, schema, it}) {
    let emptySchemas = true
    const valid = gen.name("valid")
    gen.block(() =>
      schema.forEach((sch: object | boolean, i: number) => {
        if (alwaysValidSchema(it, sch)) return
        emptySchemas = false
        applySubschema(it, {keyword: "allOf", schemaProp: i}, valid)
        if (!it.allErrors) gen.if(valid)
      })
    )

    if (emptySchemas) ok()
    else ok(valid)

    // TODO possibly add allOf error
  },
}

module.exports = def
