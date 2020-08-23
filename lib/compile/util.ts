// TODO switch to exports - below are used in dot templates
module.exports = {
  checkDataType,
  checkDataTypes,
  toHash,
  escapeQuotes,
  varOccurrences,
  varReplace,
  schemaHasRules,
  schemaHasRulesExcept,
  schemaUnknownRules,
  toQuotedString,
  getPathExpr,
  getPath,
  getData,
  getProperty,
  unescapeFragment,
  escapeFragment,
}

export function checkDataType(
  dataType: string,
  data: string,
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
  data: string,
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
export function getProperty(key: string | number): string {
  return typeof key === "number"
    ? `[${key}]`
    : IDENTIFIER.test(key)
    ? `.${key}`
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

export function varOccurrences(str: string, dataVar: string): number {
  dataVar += "[^0-9]"
  /* eslint-disable @typescript-eslint/prefer-regexp-exec */
  const matches = str.match(new RegExp(dataVar, "g"))
  return matches ? matches.length : 0
}

export function varReplace(str: string, dataVar: string, expr: string): string {
  dataVar += "([^0-9])"
  expr = expr.replace(/\$/g, "$$$$")
  return str.replace(new RegExp(dataVar, "g"), expr + "$1")
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
  expr: string,
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
export function getData($data: string, lvl: number, paths: (number | string)[]): string {
  let jsonPointer, data
  if ($data === "") return "rootData"
  if ($data[0] === "/") {
    if (!JSON_POINTER.test($data)) {
      throw new Error("Invalid JSON-pointer: " + $data)
    }
    jsonPointer = $data
    data = "rootData"
  } else {
    const matches = RELATIVE_JSON_POINTER.exec($data)
    if (!matches) throw new Error("Invalid JSON-pointer: " + $data)
    const up: number = +matches[1]
    jsonPointer = matches[2]
    if (jsonPointer === "#") {
      if (up >= lvl) {
        throw new Error(
          "Cannot access property/index " + up + " levels up, current level is " + lvl
        )
      }
      return "" + paths[lvl - up]
    }

    if (up > lvl) {
      throw new Error("Cannot access data " + up + " levels up, current level is " + lvl)
    }
    data = "data" + (lvl - up || "")
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
