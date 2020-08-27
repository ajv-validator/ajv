import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"
import {reportError, resetErrorsCount} from "../../compile/errors"
import N from "../../compile/names"

const def: CodeKeywordDefinition = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  code(cxt: KeywordContext) {
    const {gen, schema, data, it} = cxt
    const errsCount = gen.const("_errs", N.errors)

    if (alwaysValidSchema(it, schema)) {
      cxt.fail(`${data}.length === 0`)
      return
    }

    const valid = gen.name("valid")
    const i = gen.name("i")
    gen.for(`let ${i}=0; ${i}<${data}.length; ${i}++`, () => {
      applySubschema(
        it,
        {
          keyword: "contains",
          dataProp: i,
          expr: Expr.Num,
          compositeRule: true,
        },
        valid
      )
      gen.if(valid, "break")
    })

    // TODO refactor failCompoundOrReset? It is different from anyOf though
    gen.if(`!${valid}`)
    reportError(cxt, def.error as KeywordErrorDefinition)
    gen.else()
    resetErrorsCount(gen, errsCount)
    if (it.allErrors) gen.endIf()
  },
  error: {
    message: "should contain a valid item",
  },
}

module.exports = def
