import {CodeKeywordDefinition} from "../../types"
import {checkStrictMode} from "../util"

const def: CodeKeywordDefinition = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({keyword, parentSchema, it}) {
    if (parentSchema.if === undefined) checkStrictMode(it, `"${keyword}" without "if" is ignored`)
  },
}

module.exports = def
