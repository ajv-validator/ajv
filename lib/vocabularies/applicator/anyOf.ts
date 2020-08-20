import {KeywordDefinition, KeywordErrorDefinition} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError, resetErrorsCount} from "../../compile/errors"

const def: KeywordDefinition = {
  keyword: "anyOf",
  schemaType: "array",
  code(cxt) {
    const {gen, ok, schema, it} = cxt
    const alwaysValid = schema.some((sch: object | boolean) => alwaysValidSchema(it, sch))
    if (alwaysValid) {
      ok()
      return
    }
    const valid = gen.name("valid")
    const schValid = gen.name("_valid")
    const errsCount = gen.name("_errs")
    gen.code(
      `let ${valid} = false;
      const ${errsCount} = errors;`
    )

    gen.block(() => {
      schema.forEach((_, i: number) => {
        applySubschema(
          it,
          {
            keyword: "anyOf",
            schemaProp: i,
            compositeRule: true,
          },
          schValid
        )
        gen.code(`${valid} = ${valid} || ${schValid};`)
        gen.if(`!${valid}`)
      })
    }, schema.length)

    // TODO refactor failCompoundOrReset?
    // TODO refactor ifs
    gen.code(`if (!${valid}) {`)
    reportExtraError(cxt, def.error as KeywordErrorDefinition)
    gen.code(`} else {`)
    resetErrorsCount(gen, errsCount)
    if (it.allErrors) gen.code(`}`)
  },
  error: {
    message: "should match some schema in anyOf",
  },
}

module.exports = def
