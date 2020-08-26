import {CodeKeywordDefinition} from "../../types"
import {dataNotType} from "../util"
import {_, str} from "../../compile/codegen"

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
    message: ({schemaCode}) => str`should be multiple of ${schemaCode}`,
    params: ({schemaCode}) => _`{multipleOf: ${schemaCode}}`,
  },
}

module.exports = def
