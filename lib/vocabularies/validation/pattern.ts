import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {bad$DataType, usePattern} from "../util"
import {_, str, or} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: true,
  code(cxt: KeywordContext) {
    const {gen, data, $data, schema, schemaCode} = cxt
    const bdt = bad$DataType(schemaCode, <string>def.schemaType, $data)
    const regExp = $data ? _`(new RegExp(${schemaCode}))` : usePattern(gen, schema) // TODO regexp should be wrapped in try/catch
    cxt.fail(or(bdt, _`!${regExp}.test(${data})`))
  },
  error: {
    message: ({schemaCode}) => str`should match pattern "${schemaCode}"`,
    params: ({schemaCode}) => _`{pattern: ${schemaCode}}`,
  },
}

module.exports = def
