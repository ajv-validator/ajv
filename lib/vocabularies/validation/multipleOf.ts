import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {bad$DataType} from "../util"
import {_, str, or} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: true,
  code(cxt: KeywordContext) {
    const {gen, data, $data, schemaCode, it} = cxt
    const bdt = bad$DataType(schemaCode, <string>def.schemaType, $data)
    const prec = it.opts.multipleOfPrecision
    const res = gen.const("res", _`${data}/${schemaCode}`)
    const invalid = prec
      ? _`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}`
      : _`${res} !== parseInt(${res})`
    cxt.fail(or(bdt, invalid))
  },
  error: {
    message: ({schemaCode}) => str`should be multiple of ${schemaCode}`,
    params: ({schemaCode}) => _`{multipleOf: ${schemaCode}}`,
  },
}

module.exports = def
