"use strict"

const {appendSchema, dataNotType} = require("../compile/util")

const OPS = {
  maximum: {fail: ">", ok: "<="},
  minimum: {fail: "<", ok: ">="},
  exclusiveMaximum: {fail: ">=", ok: "<"},
  exclusiveMinimum: {fail: "<=", ok: ">"},
}

module.exports = {
  keywords: ["maximum", "minimum", "exclusiveMaximum", "exclusiveMinimum"],
  type: "number",
  schemaType: "number",
  $data: true,
  code: ({keyword, fail, data, $data, schemaCode, schemaType}) => {
    const dnt = dataNotType($data, schemaCode, schemaType)
    fail(dnt + data + OPS[keyword].fail + schemaCode + ` || ${data}!==${data}`)
  },
  error: {
    message: ({keyword, $data, schemaCode}) =>
      `"should be ${OPS[keyword].ok} ${appendSchema($data, schemaCode)}`,
    params: ({keyword, schemaCode}) =>
      `{ comparison: "${OPS[keyword].ok}", limit: ${schemaCode} }`,
  },
}
