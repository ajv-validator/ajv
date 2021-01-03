import type {CodeKeywordDefinition, ErrorObject, KeywordErrorDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_} from "../../compile/codegen"
import equal = require("fast-deep-equal")

export type ConstError = ErrorObject<"const", {allowedValue: any}>

const error: KeywordErrorDefinition = {
  message: "should be equal to constant",
  params: ({schemaCode}) => _`{allowedValue: ${schemaCode}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "const",
  $data: true,
  error,
  code(cxt: KeywordCxt) {
    const eql = cxt.gen.scopeValue("func", {
      ref: equal,
      code: _`require("ajv/lib/compile/equal")`,
    })
    // TODO optimize for scalar values in schema
    cxt.fail$data(_`!${eql}(${cxt.data}, ${cxt.schemaCode})`)
  },
}

export default def
