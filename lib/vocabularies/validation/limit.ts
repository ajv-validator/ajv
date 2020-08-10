import {KeywordDefinition} from "../../types"
import {appendSchema, dataNotType} from "../util"

const OPS = {
  maximum: {fail: ">", ok: "<="},
  minimum: {fail: "<", ok: ">="},
  exclusiveMaximum: {fail: ">=", ok: "<"},
  exclusiveMinimum: {fail: "<=", ok: ">"},
}

const SCH_TYPE = "number"

const def: KeywordDefinition = {
  keyword: ["maximum", "minimum", "exclusiveMaximum", "exclusiveMinimum"],
  type: "number",
  schemaType: SCH_TYPE,
  $data: true,
  code({fail, keyword, data, $data, schemaCode}) {
    const dnt = dataNotType(schemaCode, SCH_TYPE, $data)
    fail(dnt + data + OPS[keyword].fail + schemaCode + ` || ${data}!==${data}`)
  },
  error: {
    message: ({keyword, $data, schemaCode}) =>
      `"should be ${OPS[keyword].ok} ${appendSchema(schemaCode, $data)}`,
    params: ({keyword, schemaCode}) =>
      `{comparison: "${OPS[keyword].ok}", limit: ${schemaCode}}`,
  },
}

module.exports = def
