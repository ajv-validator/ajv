import type {CodeKeywordDefinition, ErrorObject, KeywordErrorDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {usePattern} from "../code"
import {_, str} from "../../compile/codegen"

export type PatternError = ErrorObject<"pattern", {pattern: string}, string | {$data: string}>

const error: KeywordErrorDefinition = {
  message: ({schemaCode}) => str`should match pattern "${schemaCode}"`,
  params: ({schemaCode}) => _`{pattern: ${schemaCode}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: true,
  error,
  code(cxt: KeywordCxt) {
    const {gen, data, $data, schema, schemaCode} = cxt
    const regExp = $data ? _`(new RegExp(${schemaCode}, "u"))` : usePattern(gen, schema) // TODO regexp should be wrapped in try/catch
    cxt.fail$data(_`!${regExp}.test(${data})`)
  },
}

export default def
