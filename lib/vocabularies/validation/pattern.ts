import {KeywordDefinition} from "../../types"
import {dataNotType} from "../util"

const SCH_TYPE = "string"

const def: KeywordDefinition = {
  keyword: "pattern",
  type: "string",
  schemaType: SCH_TYPE,
  $data: true,
  code({fail, usePattern, data, $data, schema, schemaCode}) {
    const dnt = dataNotType(schemaCode, SCH_TYPE, $data)
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
