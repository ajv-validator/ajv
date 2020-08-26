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
    const errsCount = gen.const("_errs", "errors")
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
    gen.if(valid)
    reportError(cxt, def.error as KeywordErrorDefinition)
    gen.else()
    resetErrorsCount(gen, errsCount)
    if (it.allErrors) gen.endIf()
  },
  error: {
    message: "should NOT be valid",
  },
}

module.exports = def
