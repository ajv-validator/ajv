import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"
import {_} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(cxt: KeywordContext) {
    const {gen, schema, data, it} = cxt
    const len = gen.const("len", `${data}.length`)
    if (Array.isArray(schema)) {
      validateDefinedItems()
    } else if (!alwaysValidSchema(it, schema)) {
      validateItems()
    }

    function validateDefinedItems(): void {
      const valid = gen.name("valid")
      schema.forEach((sch: any, i: number) => {
        if (alwaysValidSchema(it, sch)) return
        gen.if(_`${len} > ${i}`, () =>
          applySubschema(
            it,
            {
              keyword: "items",
              schemaProp: i,
              dataProp: i,
              expr: Expr.Const,
            },
            valid
          )
        )
        cxt.ok(valid)
      })
    }

    function validateItems(): void {
      const valid = gen.name("valid")
      const i = gen.name("i")
      gen.for(_`let ${i}=0; ${i}<${len}; ${i}++`, () => {
        applySubschema(it, {keyword: "items", dataProp: i, expr: Expr.Num}, valid)
        if (!it.allErrors) gen.ifNot(valid, "break")
      })
      cxt.ok(valid)
    }
  },
}

module.exports = def
