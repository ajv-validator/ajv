import {CodeKeywordDefinition, Schema} from "../../types"
import KeywordCxt from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema, Type} from "../../compile/subschema"
import {_} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(cxt: KeywordCxt) {
    const {gen, schema, data, it} = cxt
    const len = gen.const("len", _`${data}.length`)
    if (Array.isArray(schema)) {
      validateDefinedItems(schema)
    } else if (!alwaysValidSchema(it, schema)) {
      validateItems()
    }

    function validateDefinedItems(schArr: Schema[]): void {
      const valid = gen.name("valid")
      schArr.forEach((sch: Schema, i: number) => {
        if (alwaysValidSchema(it, sch)) return
        gen.if(_`${len} > ${i}`, () =>
          applySubschema(
            it,
            {
              keyword: "items",
              schemaProp: i,
              dataProp: i,
            },
            valid
          )
        )
        cxt.ok(valid)
      })
    }

    function validateItems(): void {
      const valid = gen.name("valid")
      gen.forRange("i", 0, len, (i) => {
        applySubschema(it, {keyword: "items", dataProp: i, dataPropType: Type.Num}, valid)
        if (!it.allErrors) gen.ifNot(valid, _`break`)
      })
      cxt.ok(valid)
    }
  },
}

module.exports = def
