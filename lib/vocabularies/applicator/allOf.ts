import {KeywordDefinition} from "../../types"
import {nonEmptySchema} from "../util"
import {applySubschema} from "../../compile/subschema"

const def: KeywordDefinition = {
  keyword: "allOf",
  schemaType: "array",
  code({gen, ok, schema, it}) {
    const {opts} = it
    let emptySchemas = true
    let closeBlocks = ""
    const valid = gen.name("valid")
    schema.forEach((sch: object | boolean, i: number) => {
      if (nonEmptySchema(it, sch)) {
        emptySchemas = false
        applySubschema(it, {keyword: "allOf", schemaProp: i}, valid)
        if (!opts.allErrors) {
          gen.code(`if (${valid}) {`)
          closeBlocks += "}"
        }
      }
    })

    if (!opts.allErrors) {
      if (emptySchemas) ok()
      else gen.code(closeBlocks.slice(0, -1)) // TODO refactor
    }

    // TODO possibly add allOf error
    // const valid = gen.name("valid")
    // gen.code(`let ${valid} = true;`)
    // ... in the loop:
    // gen.code(`${valid} = ${valid} && ${schValid};`)
    //
    // fail(`!${valid}`)
  },
}

module.exports = def
