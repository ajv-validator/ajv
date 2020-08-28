import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"

const def: CodeKeywordDefinition = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: true,
  code(cxt: KeywordContext) {
    const {gen, schema, data, it} = cxt

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

    cxt.result(valid, () => cxt.reset())
  },
  error: {
    message: "should contain a valid item",
  },
}

module.exports = def
