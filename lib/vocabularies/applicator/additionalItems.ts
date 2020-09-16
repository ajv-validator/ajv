import type {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {alwaysValidSchema, checkStrictMode} from "../util"
import {applySubschema, Type} from "../../compile/subschema"
import {_, Name, str} from "../../compile/codegen"

export interface AdditionalItemsErrorParams {
  limit: number
}

const error: KeywordErrorDefinition = {
  message: ({params: {len}}) => str`should NOT have more than ${len} items`,
  params: ({params: {len}}) => _`{limit: ${len}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error,
  code(cxt: KeywordCxt) {
    const {gen, schema, parentSchema, data, it} = cxt
    const len = gen.const("len", _`${data}.length`)
    const {items} = parentSchema
    if (!Array.isArray(items)) {
      checkStrictMode(it, '"additionalItems" without "items" is ignored')
      return
    }
    if (schema === false) {
      cxt.setParams({len: items.length})
      cxt.pass(_`${len} <= ${items.length}`)
    } else if (typeof schema == "object" && !alwaysValidSchema(it, schema)) {
      const valid = gen.var("valid", _`${len} <= ${items.length}`) // TODO var
      gen.ifNot(valid, () => validateItems(valid))
      cxt.ok(valid)
    }

    function validateItems(valid: Name): void {
      gen.forRange("i", items.length, len, (i) => {
        applySubschema(it, {keyword: "additionalItems", dataProp: i, dataPropType: Type.Num}, valid)
        if (!it.allErrors) gen.ifNot(valid, _`break`)
      })
    }
  },
}

export default def
