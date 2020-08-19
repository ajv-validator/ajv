import {KeywordDefinition, KeywordErrorDefinition} from "../../types"
import {nonEmptySchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError, resetErrorsCount} from "../../compile/errors"

const def: KeywordDefinition = {
  keyword: "anyOf",
  schemaType: "array",
  code(cxt) {
    const {gen, ok, schema, it} = cxt
    let hasEmptySchema = !schema.every((sch: object | boolean) => nonEmptySchema(it, sch))
    if (hasEmptySchema) {
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

    gen.startBlock()
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

    gen.endBlock(schema.length)

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
