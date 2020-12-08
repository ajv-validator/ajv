import type {
  CodeKeywordDefinition,
  ErrorObject,
  KeywordErrorDefinition,
  AnySchema,
} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, str, not, Name} from "../../compile/codegen"
import {Type} from "../../compile/subschema"
import {alwaysValidSchema} from "../../compile/util"
import {checkStrictMode} from "../../compile/validate"

export type AdditionalItemsError = ErrorObject<"additionalItems", {limit: number}, AnySchema>

const error: KeywordErrorDefinition = {
  message: ({params: {len}}) => str`should NOT have more than ${len} items`,
  params: ({params: {len}}) => _`{limit: ${len}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "additionalItems" as const,
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error,
  code(cxt: KeywordCxt) {
    const {gen, schema, parentSchema, data, it} = cxt
    const {items} = parentSchema
    if (!Array.isArray(items)) {
      checkStrictMode(it, '"additionalItems" is ignored when "items" is not an array of schemas')
      return
    }
    it.items = true
    const len = gen.const("len", _`${data}.length`)
    if (schema === false) {
      cxt.setParams({len: items.length})
      cxt.pass(_`${len} <= ${items.length}`)
    } else if (typeof schema == "object" && !alwaysValidSchema(it, schema)) {
      const valid = gen.var("valid", _`${len} <= ${items.length}`) // TODO var
      gen.if(not(valid), () => validateItems(valid))
      cxt.ok(valid)
    }

    function validateItems(valid: Name): void {
      gen.forRange("i", items.length, len, (i) => {
        cxt.subschema({keyword: "additionalItems", dataProp: i, dataPropType: Type.Num}, valid)
        if (!it.allErrors) gen.if(not(valid), () => gen.break())
      })
    }
  },
}

export default def
