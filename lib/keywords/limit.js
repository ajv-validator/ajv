const {appendSchema, dataNotType} = require("../compile/util")

const OPS = {
  maximum: {fail: ">", ok: "<="},
  minimum: {fail: "<", ok: ">="},
  exclusiveMaximum: {fail: ">=", ok: "<"},
  exclusiveMinimum: {fail: "<=", ok: ">"},
}

const SCHEMA_TYPE = "number"

module.exports = {
  keywords: ["maximum", "minimum", "exclusiveMaximum", "exclusiveMinimum"],
  type: "number",
  schemaType: SCHEMA_TYPE,
  $data: true,
  code({fail, keyword, data, $data, schemaCode}) {
    const dnt = dataNotType($data, schemaCode, SCHEMA_TYPE)
    fail(dnt + data + OPS[keyword].fail + schemaCode + ` || ${data}!==${data}`)
  },
  error: {
    message: ({keyword, $data, schemaCode}) =>
      `"should be ${OPS[keyword].ok} ${appendSchema($data, schemaCode)}`,
    params: ({keyword, schemaCode}) =>
      `{comparison: "${OPS[keyword].ok}", limit: ${schemaCode}}`,
  },
}
