import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportError, resetErrorsCount} from "../../compile/errors"
import N from "../../compile/names"

const def: CodeKeywordDefinition = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  code(cxt: KeywordContext) {
    const {gen, schema, it} = cxt
    if (alwaysValidSchema(it, schema)) {
      cxt.fail()
      return
    }

    const valid = gen.name("valid")
    const errsCount = gen.const("_errs", N.errors)
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
