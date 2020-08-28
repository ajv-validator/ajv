import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"
import {resetErrorsCount} from "../../compile/errors"
import N from "../../compile/names"

const error: KeywordErrorDefinition = {
  message: "should contain a valid item",
}

const def: CodeKeywordDefinition = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error,
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

    cxt.result(valid, () => resetErrorsCount(gen, errsCount))
  },
}

module.exports = def
