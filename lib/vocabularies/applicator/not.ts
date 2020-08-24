import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportError, resetErrorsCount} from "../../compile/errors"

const def: CodeKeywordDefinition = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  code(cxt) {
    const {gen, fail, schema, it} = cxt
    if (alwaysValidSchema(it, schema)) return fail()

    const valid = gen.name("valid")
    const errsCount = gen.name("_errs")
    gen.code(`const ${errsCount} = errors;`)
    applySubschema(
      it,
      {
        keyword: "not",
        compositeRule: true,
        createErrors: false,
        allErrors: false,
      },
      valid
    )

    // TODO refactor failCompoundOrReset?
    // TODO refactor ifs
    gen.code(`if (${valid}) {`)
    reportError(cxt, def.error as KeywordErrorDefinition)
    gen.code(`} else {`)
    resetErrorsCount(gen, errsCount)
    if (it.allErrors) gen.code(`}`)
  },
  error: {
    message: "should NOT be valid",
  },
}

module.exports = def
