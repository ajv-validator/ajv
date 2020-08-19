import {KeywordDefinition} from "../../types"
import {nonEmptySchema} from "../util"
import {applySubschema} from "../../compile/subschema"

const def: KeywordDefinition = {
  keyword: "allOf",
  schemaType: "array",
  code({gen, ok, schema, it}) {
    const {opts} = it
    let emptySchemas = true
    const valid = gen.name("valid")
    let count = 0
    schema.forEach((sch: object | boolean, i: number) => {
      if (nonEmptySchema(it, sch)) {
        emptySchemas = false
        applySubschema(it, {keyword: "allOf", schemaProp: i}, valid)
        if (!opts.allErrors) {
          if (count === 1) gen.startBlock()
          count++
          gen.if(`${valid}`)
        }
      }
    })

    if (!opts.allErrors) {
      if (emptySchemas) ok()
      else if (count > 1) gen.endBlock(count - 1)
    }

    // TODO possibly add allOf error
  },
}

module.exports = def
