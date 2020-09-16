import type {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, str, operators, Code} from "../../compile/codegen"

const ops = operators

const OPS: {[index: string]: {fail: Code; ok: Code; okStr: string}} = {
  maximum: {okStr: "<=", ok: ops.LTE, fail: ops.GT},
  minimum: {okStr: ">=", ok: ops.GTE, fail: ops.LT},
  exclusiveMaximum: {okStr: "<", ok: ops.LT, fail: ops.GTE},
  exclusiveMinimum: {okStr: ">", ok: ops.GT, fail: ops.LTE},
}

const error: KeywordErrorDefinition = {
  message: ({keyword, schemaCode}) => str`should be ${OPS[keyword].okStr} ${schemaCode}`,
  params: ({keyword, schemaCode}) => _`{comparison: ${OPS[keyword].okStr}, limit: ${schemaCode}}`,
}

const def: CodeKeywordDefinition = {
  keyword: ["maximum", "minimum", "exclusiveMaximum", "exclusiveMinimum"],
  type: "number",
  schemaType: "number",
  $data: true,
  error,
  code(cxt: KeywordCxt) {
    const {keyword, data, schemaCode} = cxt
    // const bdt = bad$DataType(schemaCode, <string>def.schemaType, $data)
    cxt.fail$data(_`(${data} ${OPS[keyword].fail} ${schemaCode} || isNaN(${data}))`)
  },
}

export default def
