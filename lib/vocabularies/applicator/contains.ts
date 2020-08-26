import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"
import {reportError, resetErrorsCount} from "../../compile/errors"

const def: CodeKeywordDefinition = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  code(cxt) {
    const {gen, fail, schema, data, it} = cxt
    const errsCount = gen.const("_errs", "errors")

    if (alwaysValidSchema(it, schema)) return fail(`${data}.length === 0`)

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
