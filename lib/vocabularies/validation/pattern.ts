import type {CodeKeywordDefinition, ErrorObject, KeywordErrorDefinition} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import {usePattern} from "../code"
import {_, str} from "../../compile/codegen"

export type PatternError = ErrorObject<"pattern", {pattern: string}, string | {$data: string}>

const error: KeywordErrorDefinition = {
  message: ({schemaCode}) => str`must match pattern "${schemaCode}"`,
  params: ({schemaCode}) => _`{pattern: ${schemaCode}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: true,
  error,
  code(cxt: KeywordCxt) {
    const {gen, data, $data, schema, schemaCode, it} = cxt
    const regExpFlags = it.opts.unicodeRegExp ? "u" : ""
    // TODO regexp should be wrapped in try/catchs
    const regExp = $data
      ? _`(new RegExp(${schemaCode}, ${regExpFlags}))`
      : usePattern(gen, schema, regExpFlags)
    cxt.fail$data(_`!${regExp}.test(${data})`)
  },
}

export default def
