import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
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
  code(cxt: KeywordContext) {
    const {keyword, data, $data, schemaCode} = cxt
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    cxt.fail(dnt + data + OPS[keyword].fail + schemaCode + ` || isNaN(${data})`)
  },
  error: {
    message: ({keyword, schemaCode}) => str`should be ${OPS[keyword].ok} ${schemaCode}`,
    params: ({keyword, schemaCode}) => _`{comparison: ${OPS[keyword].ok}, limit: ${schemaCode}}`,
  },
}

module.exports = def
