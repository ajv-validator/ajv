import {KeywordDefinition} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"

const def: KeywordDefinition = {
  keyword: "allOf",
  schemaType: "array",
  code({gen, ok, schema, it}) {
    let emptySchemas = true
    const valid = gen.name("valid")
    let count = 0
    schema.forEach((sch: object | boolean, i: number) => {
      if (alwaysValidSchema(it, sch)) return
      emptySchemas = false
      applySubschema(it, {keyword: "allOf", schemaProp: i}, valid)
      if (!it.allErrors) {
        if (count === 1) gen.block()
        count++
        gen.if(valid)
      }
    })

    if (!it.allErrors) {
      if (emptySchemas) ok()
      else if (count > 1) gen.endBlock(count - 1)
    }

    // TODO possibly add allOf error
  },
}

module.exports = def
