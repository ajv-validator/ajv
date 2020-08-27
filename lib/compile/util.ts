import {_, Code, Name, Expression} from "./codegen"
import {CompilationContext} from "../types"
import N from "./names"

export function checkDataType(
  dataType: string,
  data: Name,
  strictNumbers?: boolean,
  negate?: boolean
): string {
  const EQ = negate ? " !== " : " === "
  const OK = negate ? "!" : ""
  switch (dataType) {
    case "null":
      return data + EQ + "null"
    case "array":
      return OK + `Array.isArray(${data})`
    case "object":
      return OK + `(${data} && typeof ${data} === "object" && !Array.isArray(${data}))`
    case "integer":
      return (
        OK +
        `(typeof ${data} === "number" && !(${data} % 1) && !isNaN(${data})` +
        (strictNumbers ? ` && isFinite(${data}))` : ")")
      )
    case "number":
      return OK + `(typeof ${data} === "number"` + (strictNumbers ? `&& isFinite(${data}))` : ")")
    default:
      return `typeof ${data} ${EQ} "${dataType}"`
  }
}

export function checkDataTypes(
  dataTypes: string[],
  data: Name,
  strictNumbers?: boolean,
  negate?: true
): string {
  if (dataTypes.length === 1) {
    return checkDataType(dataTypes[0], data, strictNumbers, true)
  }
  let code = ""
  const types = toHash(dataTypes)
  if (types.array && types.object) {
    code = types.null ? "(" : `(!${data} || `
    code += `typeof ${data} !== "object")`
    delete types.null
    delete types.array
    delete types.object
  }
  if (types.number) delete types.integer
  for (const t in types) {
    code += (code ? " && " : "") + checkDataType(t, data, strictNumbers, negate)
  }
  return code
}

export function toHash(arr: string[]): {[key: string]: true} {
  const hash = {}
  for (const item of arr) hash[item] = true
  return hash
}

const IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i
const SINGLE_QUOTE = /'|\\/g
export function getProperty(key: Expression | number): string {
  // return key instanceof Name || (typeof key == "string" && IDENTIFIER.test(key))
  //   ? _`.${key}`
  //   : _`[${key}]`

  return key instanceof Name || (typeof key == "string" && IDENTIFIER.test(key))
    ? `.${key}`
    : key instanceof Code || typeof key === "number"
    ? `[${key}]`
    : `['${escapeQuotes(key)}']`
}

export function escapeQuotes(str: string): string {
  return str
    .replace(SINGLE_QUOTE, "\\$&")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\f/g, "\\f")
    .replace(/\t/g, "\\t")
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

export function toQuotedString(str: string): string {
  return `'${escapeQuotes(str)}'`
}

export function getPathExpr(
  currentPath: string,
  expr: Expression,
  jsonPointers?: boolean,
  isNumber?: boolean
): string {
  const path = jsonPointers // false by default
    ? `'/' + ${expr}` + (isNumber ? "" : ".replace(/~/g, '~0').replace(/\\//g, '~1')")
    : isNumber
    ? `'[' + ${expr} + ']'`
    : `'[\\'' + ${expr} + '\\']'`
  return joinPaths(currentPath, path)
}

export function getPath(
  currentPath: string,
  prop: string | number,
  jsonPointers?: boolean
): string {
  const path = toQuotedString(
    jsonPointers // false by default
      ? "/" + (typeof prop == "number" ? prop : escapeJsonPointer(prop))
      : getProperty(prop)
  )
  return joinPaths(currentPath, path)
}

const JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/
const RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/
export function getData(
  $data: string,
  {dataLevel, dataNames, dataPathArr}: CompilationContext
): Expression | number {
  let jsonPointer, data
  if ($data === "") return N.rootData
  if ($data[0] === "/") {
    if (!JSON_POINTER.test($data)) {
      throw new Error("Invalid JSON-pointer: " + $data)
    }
    jsonPointer = $data
    data = N.rootData
  } else {
    const matches = RELATIVE_JSON_POINTER.exec($data)
    if (!matches) throw new Error("Invalid JSON-pointer: " + $data)
    const up: number = +matches[1]
    jsonPointer = matches[2]
    if (jsonPointer === "#") {
      if (up >= dataLevel) {
        throw new Error(errorMsg("property/index", up))
      }
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
      data += getProperty(unescapeJsonPointer(segment))
      expr += " && " + data
    }
  }
  return expr

  function errorMsg(pointerType: string, up: number): string {
    return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`
  }
}

export function joinPaths(a: string, b: string): string {
  if (a === '""' || a === "''") return b
  if (b === '""' || b === "''") return a
  return `${a} + ${b}`.replace(/([^\\])' \+ '/g, "$1")
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

export function unescapeJsonPointer(str: string): string {
  return str.replace(/~1/g, "/").replace(/~0/g, "~")
}
