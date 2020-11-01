import type {CodeKeywordDefinition, ErrorObject} from "../../types"
import {validatePropertyDeps, error} from "../applicator/dependencies"

export type DependentRequiredError = ErrorObject<
  "dependentRequired",
  {
    property: string
    missingProperty: string
    depsCount: number
    deps: string // TODO change to string[]
  }
>

const def: CodeKeywordDefinition = {
  keyword: "dependentRequired",
  type: "object",
  schemaType: "object",
  // TODO remove metaSchema when 2019-09 is fully supported
  metaSchema: {
    type: "object",
    additionalProperties: {
      type: "array",
      items: {type: "string"},
    },
  },
  error,
  code: (cxt) => validatePropertyDeps(cxt),
}

export default def
