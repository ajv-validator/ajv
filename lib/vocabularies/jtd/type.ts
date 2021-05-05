import type {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import {_, or, Code} from "../../compile/codegen"
import validTimestamp from "../../runtime/timestamp"
import {useFunc} from "../../compile/util"
import {checkMetadata} from "./metadata"
import {typeErrorMessage, typeErrorParams, _JTDTypeError} from "./error"
import {_Code} from "../../compile/codegen/code"

export type JTDTypeError = _JTDTypeError<"type", JTDType, JTDType>

export type IntType = "int8" | "uint8" | "int16" | "uint16" | "int32" | "uint32"

export const intRange: {[T in IntType]: [number, number, number]} = {
  int8: [-128, 127, 3],
  uint8: [0, 255, 3],
  int16: [-32768, 32767, 5],
  uint16: [0, 65535, 5],
  int32: [-2147483648, 2147483647, 10],
  uint32: [0, 4294967295, 10],
}

export type JTDType = "boolean" | "string" | "timestamp" | "float32" | "float64" | IntType

const error: KeywordErrorDefinition = {
  message: (cxt) => typeErrorMessage(cxt, cxt.schema),
  params: (cxt) => typeErrorParams(cxt, cxt.schema),
}

function timestampCode(cxt: KeywordCxt): _Code {
  const {gen, data} = cxt
  switch (cxt.it.opts.timestamp) {
    case "date":
      return _`${data} instanceof Date `
    case "string": {
      const vts = useFunc(gen, validTimestamp)
      return _`typeof ${data} == "string" && ${vts}(${data})`
    }
    default: {
      const vts = useFunc(gen, validTimestamp)
      return _`${data} instanceof Date || (typeof ${data} == "string" && ${vts}(${data}))`
    }
  }
}

const def: CodeKeywordDefinition = {
  keyword: "type",
  schemaType: "string",
  error,
  code(cxt: KeywordCxt) {
    checkMetadata(cxt)
    const {data, schema, parentSchema} = cxt
    let cond: Code
    switch (schema) {
      case "boolean":
      case "string":
        cond = _`typeof ${data} == ${schema}`
        break
      case "timestamp": {
        cond = timestampCode(cxt)
        break
      }
      case "float32":
      case "float64":
        cond = _`typeof ${data} == "number"`
        break
      default: {
        const [min, max] = intRange[schema as IntType]
        cond = _`typeof ${data} == "number" && isFinite(${data}) && ${data} >= ${min} && ${data} <= ${max} && !(${data} % 1)`
      }
    }
    cxt.pass(parentSchema.nullable ? or(_`${data} === null`, cond) : cond)
  },
}

export default def
