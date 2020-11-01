import type {CodeKeywordDefinition} from "../../types"
import {validateSchemaDeps} from "./dependencies"

const def: CodeKeywordDefinition = {
  keyword: "dependentSchemas",
  type: "object",
  schemaType: "object",
  // TODO remove metaSchema when 2019-09 is fully supported
  metaSchema: {
    type: "object",
    additionalProperties: {type: ["object", "boolean"]},
  },
  code: (cxt) => validateSchemaDeps(cxt),
}

export default def
