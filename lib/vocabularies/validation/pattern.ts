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
    const {data, $data, schema, schemaCode, it} = cxt
    const u = it.opts.unicodeRegExp ? "u" : ""
    const regExp = $data
      ? _`(function() {
        try {
          return new RegExp(${schemaCode}, ${u})
        } catch (e) {
          throw new Error(e.message + ' | pattern ' + ${schemaCode} + ' at ' + ${it.errSchemaPath})
        }
      })()`
      : usePattern(cxt, schema)
    cxt.fail$data(_`!${regExp}.test(${data})`)
  },
}

export default def
