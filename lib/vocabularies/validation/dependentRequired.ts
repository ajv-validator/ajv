import type {CodeKeywordDefinition} from "../../types"
import {
  validatePropertyDeps,
  error,
  DependenciesError,
  PropertyDependencies,
} from "../applicator/dependencies"

export type DependentRequiredError = DependenciesError<"dependentRequired", PropertyDependencies>

const def: CodeKeywordDefinition = {
  keyword: "dependentRequired",
  type: "object",
  schemaType: "object",
  error,
  code: (cxt) => validatePropertyDeps(cxt),
}

export default def
