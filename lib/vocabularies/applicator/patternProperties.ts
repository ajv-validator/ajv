import {KeywordDefinition} from "../../types"
import {schemaProperties, loopPropertiesCode} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"

const def: KeywordDefinition = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(cxt) {
    const {gen, ok, schema, it} = cxt
    const patterns = schemaProperties(it, schema)
    if (patterns.length === 0) {
      ok()
      return
    }

    const valid = gen.name("valid")
    const errsCount = gen.name("_errs")
    gen.code(`const ${errsCount} = errors;`)

    gen.block(validatePatternProperties)

    // TODO refactor ifs
    if (!it.allErrors) gen.code(`if (${errsCount} === errors) {`)

    function validatePatternProperties() {
      for (const pat of patterns) {
        if (it.allErrors) {
          validateProperties(pat)
        } else {
          gen.code(`var ${valid} = true`) // TODO var
          validateProperties(pat)
          gen.if(valid)
        }
      }
    }

    function validateProperties(pat: string) {
      loopPropertiesCode(cxt, (key) => {
        gen.if(`${it.usePattern(pat)}.test(${key})`, () => {
          applySubschema(
            it,
            {
              keyword: "patternProperties",
              schemaProp: pat,
              dataProp: key,
              expr: Expr.Str,
            },
            valid
          )
          if (!it.allErrors) gen.if(`!${valid}`, "break")
        })
      })
    }
  },
}

module.exports = def
