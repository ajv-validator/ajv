import {CodeKeywordDefinition} from "../../types"
import {dataNotType} from "../util"
import {_, str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: true,
  code({fail, data, $data, schema, schemaCode, it: {usePattern}}) {
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    const regExp = $data ? _`(new RegExp(${schemaCode}))` : usePattern(schema)
    fail(dnt + `!${regExp}.test(${data})`) // TODO pass?
  },
  error: {
    message: ({schemaCode}) => str`should match pattern "${schemaCode}"`,
    params: ({schemaCode}) => _`{pattern: ${schemaCode}}`,
  },
}

module.exports = def
