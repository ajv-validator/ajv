import {CodeKeywordDefinition} from "../../types"
import {dataNotType} from "../util"

const def: CodeKeywordDefinition = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: true,
  code({fail, data, $data, schema, schemaCode, it: {usePattern}}) {
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    const regExp = $data ? `(new RegExp(${schemaCode}))` : usePattern(schema)
    fail(dnt + `!${regExp}.test(${data})`)
  },
  error: {
    message: ({$data, schemaCode}) =>
      $data
        ? `'should match pattern "' + ${schemaCode} + '"'`
        : `"should match pattern \\"${(<string>schemaCode).slice(1, -1)}\\""`,
    params: ({schemaCode}) => `{pattern: ${schemaCode}}`,
  },
}

module.exports = def
