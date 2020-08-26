import {CodeKeywordDefinition} from "../../types"
import {appendSchema, dataNotType} from "../util"
import {_} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: true,
  code({gen, fail, data, $data, schemaCode, it: {opts}}) {
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    const res = gen.let("res")
    const prec = opts.multipleOfPrecision
    const invalid = prec
      ? _`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}`
      : _`${res} !== parseInt(${res})`
    fail(dnt + `(${res} = ${data}/${schemaCode}, ${invalid})`) // TODO pass
  },
  error: {
    message: ({$data, schemaCode}) => `"should be multiple of ${appendSchema(schemaCode, $data)}`,
    params: ({schemaCode}) => `{multipleOf: ${schemaCode}}`,
  },
}

module.exports = def
