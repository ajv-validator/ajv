import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema, Type} from "../../compile/subschema"
import {_} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: true,
  code(cxt: KeywordCxt) {
    const {gen, schema, data, it} = cxt

    if (alwaysValidSchema(it, schema)) {
      cxt.fail(_`${data}.length === 0`)
      return
    }

    const valid = gen.name("valid")
    gen.forRange("i", 0, _`${data}.length`, (i) => {
      applySubschema(
        it,
        {
          keyword: "contains",
          dataProp: i,
          dataPropType: Type.Num,
          compositeRule: true,
        },
        valid
      )
      gen.if(valid, _`break`)
    })

    cxt.result(valid, () => cxt.reset())
  },
  error: {
    message: "should contain a valid item",
  },
}

export default def
