import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_} from "../../compile/codegen"
import {Type} from "../../compile/subschema"
import {alwaysValidSchema} from "../../compile/util"

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
      cxt.subschema(
        {
          keyword: "contains",
          dataProp: i,
          dataPropType: Type.Num,
          compositeRule: true,
        },
        valid
      )
      gen.if(valid, () => gen.break())
    })

    cxt.result(valid, () => cxt.reset())
  },
  error: {
    message: "should contain a valid item",
  },
}

export default def
