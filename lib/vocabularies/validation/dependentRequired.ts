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
  error,
  code: (cxt) => validatePropertyDeps(cxt),
}

export default def
