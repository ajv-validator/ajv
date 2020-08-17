import {KeywordDefinition} from "../../types"
import {appendSchema, dataNotType} from "../util"

const OPS = {
  maximum: {fail: ">", ok: "<="},
  minimum: {fail: "<", ok: ">="},
  exclusiveMaximum: {fail: ">=", ok: "<"},
  exclusiveMinimum: {fail: "<=", ok: ">"},
}

const def: KeywordDefinition = {
  keyword: ["maximum", "minimum", "exclusiveMaximum", "exclusiveMinimum"],
  type: "number",
  schemaType: "number",
  $data: true,
  code({fail, keyword, data, $data, schemaCode}) {
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    fail(dnt + data + OPS[keyword].fail + schemaCode + ` || isNaN(${data})`)
  },
  error: {
    message: ({keyword, $data, schemaCode}) =>
      `"should be ${OPS[keyword].ok} ${appendSchema(schemaCode, $data)}`,
    params: ({keyword, schemaCode}) => `{comparison: "${OPS[keyword].ok}", limit: ${schemaCode}}`,
  },
}

module.exports = def
