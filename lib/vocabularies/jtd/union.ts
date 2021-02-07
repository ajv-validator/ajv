import {KeywordCxt} from "../../ajv"
import type {CodeKeywordDefinition} from "../../types"
import {validateUnion} from "../code"

const def: CodeKeywordDefinition = {
  keyword: "union",
  schemaType: "array",
  trackErrors: true,
  code(cxt: KeywordCxt) {
    // if (!cxt.it.schemaEnv.meta) throw new Error("JTD: union keyword is only allowed in meta-schema")
    validateUnion(cxt)
  },
}

export default def
