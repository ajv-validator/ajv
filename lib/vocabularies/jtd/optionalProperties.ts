import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {validateProperties} from "./properties"

const def: CodeKeywordDefinition = {
  keyword: "optionalProperties",
  schemaType: "object",
  code(cxt: KeywordCxt) {
    if (cxt.parentSchema.properties) return
    validateProperties(cxt)
  },
}

export default def
