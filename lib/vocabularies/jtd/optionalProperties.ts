import type {CodeKeywordDefinition} from "../../types"
import {validateProperties} from "./properties"

const def: CodeKeywordDefinition = {
  keyword: "optionalProperties",
  schemaType: "object",
  code(cxt) {
    if (cxt.parentSchema.properties) return
    validateProperties(cxt)
  },
}

export default def
