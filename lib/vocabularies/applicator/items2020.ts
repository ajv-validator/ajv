import type {CodeKeywordDefinition} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import {alwaysValidSchema} from "../../compile/util"
import {validateArray} from "../code"
import {validateAdditionalItems} from "./additionalItems"

const def: CodeKeywordDefinition = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  code(cxt: KeywordCxt) {
    const {schema, parentSchema, it} = cxt
    const {prefixItems} = parentSchema
    it.items = true
    if (alwaysValidSchema(it, schema)) return
    if (prefixItems) validateAdditionalItems(cxt, prefixItems)
    else cxt.ok(validateArray(cxt))
  },
}

export default def
