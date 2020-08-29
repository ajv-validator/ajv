import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {dataNotType, usePattern} from "../util"
import {_, str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: true,
  code(cxt: KeywordContext) {
    const {gen, data, $data, schema, schemaCode} = cxt
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    const regExp = $data ? _`(new RegExp(${schemaCode}))` : usePattern(gen, schema)
    cxt.fail(dnt + `!${regExp}.test(${data})`) // TODO pass?
  },
  error: {
    message: ({schemaCode}) => str`should match pattern "${schemaCode}"`,
    params: ({schemaCode}) => _`{pattern: ${schemaCode}}`,
  },
}

module.exports = def
