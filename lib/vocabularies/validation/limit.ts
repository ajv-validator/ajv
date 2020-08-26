import {CodeKeywordDefinition} from "../../types"
import {dataNotType} from "../util"
import {_, str} from "../../compile/codegen"

const OPS: {[index: string]: {fail: string; ok: string}} = {
  maximum: {fail: ">", ok: "<="},
  minimum: {fail: "<", ok: ">="},
  exclusiveMaximum: {fail: ">=", ok: "<"},
  exclusiveMinimum: {fail: "<=", ok: ">"},
}

const def: CodeKeywordDefinition = {
  keyword: ["maximum", "minimum", "exclusiveMaximum", "exclusiveMinimum"],
  type: "number",
  schemaType: "number",
  $data: true,
  code({fail, keyword, data, $data, schemaCode}) {
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    fail(dnt + data + OPS[keyword].fail + schemaCode + ` || isNaN(${data})`)
  },
  error: {
    message: ({keyword, schemaCode}) => str`should be ${OPS[keyword].ok} ${schemaCode}`,
    params: ({keyword, schemaCode}) => _`{comparison: ${OPS[keyword].ok}, limit: ${schemaCode}}`,
  },
}

module.exports = def
