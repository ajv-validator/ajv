import type {CodeKeywordDefinition} from "../../types"
import {validateUnion} from "../code"

const def: CodeKeywordDefinition = {
  keyword: "union",
  schemaType: "array",
  trackErrors: true,
  code: validateUnion,
}

export default def
