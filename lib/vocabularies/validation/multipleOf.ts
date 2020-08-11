import {KeywordDefinition} from "../../types"
import {appendSchema, dataNotType} from "../util"

const def: KeywordDefinition = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: true,
  code({write, fail, scope, data, $data, schemaCode, opts}) {
    const dnt = dataNotType(schemaCode, def.schemaType, $data)
    const res = scope.getName("res")
    const prec = opts.multipleOfPrecision
    const invalid = prec
      ? `Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}`
      : `${res} !== parseInt(${res})`
    write(`let ${res};`)
    fail(dnt + `(${res} = ${data}/${schemaCode}, ${invalid})`)
  },
  error: {
    message: ({$data, schemaCode}) => `"should be multiple of ${appendSchema(schemaCode, $data)}`,
    params: ({schemaCode}) => `{multipleOf: ${schemaCode}}`,
  },
}

module.exports = def
