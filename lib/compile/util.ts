import {_, nil, and, operators, Code, Name, getProperty} from "./codegen"
import {CompilationContext} from "../types"
import N from "./names"

export enum DataType {
  Correct,
  Wrong,
}

export function checkDataType(
  dataType: string,
  data: Name,
  strictNumbers?: boolean,
  correct = DataType.Correct
): Code {
  const EQ = correct === DataType.Correct ? operators.EQ : operators.NEQ
  let cond: Code
  switch (dataType) {
    case "null":
      return _`${data} ${EQ} null`
    case "array":
      cond = _`Array.isArray(${data})`
      break
    case "object":
      cond = _`${data} && typeof ${data} == "object" && !Array.isArray(${data})`
      break
    case "integer":
      cond = numCond(_`!(${data} % 1) && !isNaN(${data})`)
      break
    case "number":
      cond = numCond()
      break
    default:
      return _`typeof ${data} ${EQ} ${dataType}`
  }
  return correct === DataType.Correct ? cond : _`!(${cond})`

  function numCond(_cond: Code = nil): Code {
    return and(_`typeof ${data} == "number"`, _cond, strictNumbers ? _`isFinite(${data})` : nil)
  }
}

export function checkDataTypes(
  dataTypes: string[],
  data: Name,
  strictNumbers?: boolean,
  correct?: DataType
): Code {
  if (dataTypes.length === 1) {
    return checkDataType(dataTypes[0], data, strictNumbers, correct)
  }
  let cond: Code
  const types = toHash(dataTypes)
  if (types.array && types.object) {
    const notObj = _`typeof ${data} != "object"`
    cond = types.null ? notObj : _`(!${data} || ${notObj})`
    delete types.null
    delete types.array
    delete types.object
  } else {
    cond = nil
  }
  if (types.number) delete types.integer
  for (const t in types) cond = and(cond, checkDataType(t, data, strictNumbers, correct))
  return cond
}

export function toHash(arr: string[]): {[key: string]: true} {
  const hash = {}
  for (const item of arr) hash[item] = true
  return hash
}

// TODO rules, schema?
export function schemaHasRules(schema: object | boolean, rules: object): boolean | undefined {
  if (typeof schema == "boolean") return !schema
  for (const key in schema) if (rules[key]) return true
}

// TODO rules, schema?
export function schemaHasRulesExcept(
  schema: object,
  rules: object,
  exceptKeyword: string
): boolean | undefined {
  if (typeof schema == "boolean") return !schema && exceptKeyword !== "not"
  for (const key in schema) if (key !== exceptKeyword && rules[key]) return true
}

// TODO rules, schema?
export function schemaUnknownRules(schema: object, rules: object): string | undefined {
  if (typeof schema === "boolean") return
  for (const key in schema) if (!rules[key]) return key
}

const JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/
const RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/
export function getData(
  $data: string,
  {dataLevel, dataNames, dataPathArr}: CompilationContext
): Code | number {
  let jsonPointer
  let data: Code
  if ($data === "") return N.rootData
  if ($data[0] === "/") {
    if (!JSON_POINTER.test($data)) throw new Error(`Invalid JSON-pointer: ${$data}`)
    jsonPointer = $data
    data = N.rootData
  } else {
    const matches = RELATIVE_JSON_POINTER.exec($data)
    if (!matches) throw new Error(`Invalid JSON-pointer: ${$data}`)
    const up: number = +matches[1]
    jsonPointer = matches[2]
    if (jsonPointer === "#") {
      if (up >= dataLevel) throw new Error(errorMsg("property/index", up))
      return dataPathArr[dataLevel - up]
    }
    if (up > dataLevel) throw new Error(errorMsg("data", up))
    data = dataNames[dataLevel - up]
    if (!jsonPointer) return data
  }

  let expr = data
  const segments = jsonPointer.split("/")
  for (const segment of segments) {
    if (segment) {
      data = _`${data}${getProperty(unescapeJsonPointer(segment))}`
      expr = _`${expr} && ${data}`
    }
  }
  return expr

  function errorMsg(pointerType: string, up: number): string {
    return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`
  }
}

export function unescapeFragment(str: string): string {
  return unescapeJsonPointer(decodeURIComponent(str))
}

export function escapeFragment(str: string): string {
  return encodeURIComponent(escapeJsonPointer(str))
}

export function escapeJsonPointer(str: string): string {
  return str.replace(/~/g, "~0").replace(/\//g, "~1")
}

function unescapeJsonPointer(str: string): string {
  return str.replace(/~1/g, "/").replace(/~0/g, "~")
}
