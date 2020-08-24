import {CodeKeywordDefinition} from "../../types"
import {appendSchema, dataNotType} from "../util"

const def: CodeKeywordDefinition = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: true,
  code({gen, fail, data, $data, schemaCode, it: {opts}}) {
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    const res = gen.name("res")
    const prec = opts.multipleOfPrecision
    const invalid = prec
      ? `Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}`
      : `${res} !== parseInt(${res})`
    gen.code(`let ${res};`)
    fail(dnt + `(${res} = ${data}/${schemaCode}, ${invalid})`)
  },
  error: {
    message: ({$data, schemaCode}) => `"should be multiple of ${appendSchema(schemaCode, $data)}`,
    params: ({schemaCode}) => `{multipleOf: ${schemaCode}}`,
  },
}

module.exports = def
