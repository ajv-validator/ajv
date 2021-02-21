import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, or, Code} from "../../compile/codegen"
import validTimestamp from "../../compile/timestamp"
import {func} from "../../compile/util"
import {checkMetadata} from "./metadata"

export type IntType = "int8" | "uint8" | "int16" | "uint16" | "int32" | "uint32"

export const intRange: {[T in IntType]: [number, number, number]} = {
  int8: [-128, 127, 3],
  uint8: [0, 255, 3],
  int16: [-32768, 32767, 5],
  uint16: [0, 65535, 5],
  int32: [-2147483648, 2147483647, 10],
  uint32: [0, 4294967295, 10],
}

const def: CodeKeywordDefinition = {
  keyword: "type",
  schemaType: "string",
  code(cxt: KeywordCxt) {
    checkMetadata(cxt)
    const {gen, data, schema, parentSchema} = cxt
    let cond: Code
    switch (schema) {
      case "boolean":
      case "string":
        cond = _`typeof ${data} == ${schema}`
        break
      case "timestamp": {
        const vts = func(gen, validTimestamp)
        cond = _`${data} instanceof Date || (typeof ${data} == "string" && ${vts}(${data}))`
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
