import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportError, resetErrorsCount} from "../../compile/errors"
import N from "../../compile/names"

const error: KeywordErrorDefinition = {
  message: "should NOT be valid",
}

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

    cxt.result(
      valid,
      () => reportError(cxt, error),
      () => resetErrorsCount(gen, errsCount)
    )
  },
}

module.exports = def
