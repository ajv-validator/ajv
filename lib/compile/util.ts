// TODO switch to exports

module.exports = {
  checkDataType: checkDataType,
  checkDataTypes: checkDataTypes,
  coerceToTypes,
  toHash,
  escapeQuotes: escapeQuotes,
  equal: require("fast-deep-equal"),
  ucs2length: require("./ucs2length"),
  varOccurences: varOccurences,
  varReplace: varReplace,
  schemaHasRules,
  schemaHasRulesExcept: schemaHasRulesExcept,
  schemaUnknownRules: schemaUnknownRules,
  toQuotedString,
  getPathExpr: getPathExpr,
  getPath: getPath,
  getData: getData,
  getProperty,
  unescapeFragment: unescapeFragment,
  unescapeJsonPointer: unescapeJsonPointer,
  escapeFragment: escapeFragment,
  escapeJsonPointer: escapeJsonPointer,
}

function checkDataType(
  dataType: string,
  data: string,
  strictNumbers: boolean,
  negate: boolean
): string {
  var EQ = negate ? " !== " : " === ",
    OK = negate ? "!" : ""
  switch (dataType) {
    case "null":
      return data + EQ + "null"
    case "array":
      return OK + `Array.isArray(${data})`
    case "object":
      return (
        OK +
        `(${data} && typeof ${data} === "object" && !Array.isArray(${data}))`
      )
    case "integer":
      return (
        OK +
        `(typeof ${data} === "number" && !(${data} % 1) && !isNaN(${data})` +
        (strictNumbers ? ` && isFinite(${data}))` : ")")
      )
    case "number":
      return (
        OK +
        `(typeof ${data} === "number"` +
        (strictNumbers ? `&& isFinite(${data}))` : ")")
      )
    default:
      return `typeof ${data} ${EQ} "${dataType}"`
  }
}

function checkDataTypes(dataTypes, data, strictNumbers) {
  switch (dataTypes.length) {
    case 1:
      return checkDataType(dataTypes[0], data, strictNumbers, true)
    default:
      var code = ""
      var types = toHash(dataTypes)
      if (types.array && types.object) {
        code = types.null ? "(" : "(!" + data + " || "
        code += "typeof " + data + ' !== "object")'
        delete types.null
        delete types.array
        delete types.object
      }
      if (types.number) delete types.integer
      for (var t in types) {
        code +=
          (code ? " && " : "") + checkDataType(t, data, strictNumbers, true)
      }

      return code
  }
}

const COERCE_TYPES = toHash(["string", "number", "integer", "boolean", "null"])
function coerceToTypes(
  optionCoerceTypes: undefined | boolean | "array",
  dataTypes: string[]
): string[] | void {
  if (Array.isArray(dataTypes)) {
    const types: string[] = []
    for (const t of dataTypes) {
      if (COERCE_TYPES[t] || (optionCoerceTypes === "array" && t === "array"))
        types.push(t)
    }
    if (types.length) return types
    return
  }
  if (COERCE_TYPES[dataTypes]) return [dataTypes]
  if (optionCoerceTypes === "array" && dataTypes === "array") return ["array"]
}

function toHash(arr: string[]): {[key: string]: true} {
  var hash = {}
  for (var i = 0; i < arr.length; i++) hash[arr[i]] = true
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

function escapeQuotes(str: string): string {
  return str
    .replace(SINGLE_QUOTE, "\\$&")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\f/g, "\\f")
    .replace(/\t/g, "\\t")
}

function varOccurences(str, dataVar) {
  dataVar += "[^0-9]"
  var matches = str.match(new RegExp(dataVar, "g"))
  return matches ? matches.length : 0
}

function varReplace(str, dataVar, expr) {
  dataVar += "([^0-9])"
  expr = expr.replace(/\$/g, "$$$$")
  return str.replace(new RegExp(dataVar, "g"), expr + "$1")
}

function schemaHasRules(
  schema: object | boolean,
  rules: object
): boolean | undefined {
  if (typeof schema == "boolean") return !schema
  for (var key in schema) if (rules[key]) return true
}

function schemaHasRulesExcept(schema, rules, exceptKeyword) {
  if (typeof schema == "boolean") return !schema && exceptKeyword != "not"
  for (var key in schema) if (key != exceptKeyword && rules[key]) return true
}

function schemaUnknownRules(schema, rules) {
  if (typeof schema == "boolean") return
  for (var key in schema) if (!rules[key]) return key
}

export function toQuotedString(str: string): string {
  return `'${escapeQuotes(str)}'`
}

function getPathExpr(currentPath, expr, jsonPointers, isNumber) {
  var path = jsonPointers // false by default
    ? "'/' + " +
      expr +
      (isNumber ? "" : ".replace(/~/g, '~0').replace(/\\//g, '~1')")
    : isNumber
    ? "'[' + " + expr + " + ']'"
    : "'[\\'' + " + expr + " + '\\']'"
  return joinPaths(currentPath, path)
}

function getPath(currentPath, prop, jsonPointers) {
  var path = jsonPointers // false by default
    ? toQuotedString("/" + escapeJsonPointer(prop))
    : toQuotedString(getProperty(prop))
  return joinPaths(currentPath, path)
}

var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/
var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/
export function getData($data: string, lvl: number, paths: string[]): string {
  var up, jsonPointer, data, matches
  if ($data === "") return "rootData"
  if ($data[0] == "/") {
    if (!JSON_POINTER.test($data))
      throw new Error("Invalid JSON-pointer: " + $data)
    jsonPointer = $data
    data = "rootData"
  } else {
    matches = RELATIVE_JSON_POINTER.exec($data)
    if (!matches) throw new Error("Invalid JSON-pointer: " + $data)
    up = +matches[1]
    jsonPointer = matches[2]
    if (jsonPointer == "#") {
      if (up >= lvl) {
        throw new Error(
          "Cannot access property/index " +
            up +
            " levels up, current level is " +
            lvl
        )
      }
      return paths[lvl - up]
    }

    if (up > lvl) {
      throw new Error(
        "Cannot access data " + up + " levels up, current level is " + lvl
      )
    }
    data = "data" + (lvl - up || "")
    if (!jsonPointer) return data
  }

  var expr = data
  var segments = jsonPointer.split("/")
  for (var i = 0; i < segments.length; i++) {
    var segment = segments[i]
    if (segment) {
      data += getProperty(unescapeJsonPointer(segment))
      expr += " && " + data
    }
  }
  return expr
}

function joinPaths(a, b) {
  if (a == '""') return b
  return (a + " + " + b).replace(/([^\\])' \+ '/g, "$1")
}

function unescapeFragment(str) {
  return unescapeJsonPointer(decodeURIComponent(str))
}

function escapeFragment(str) {
  return encodeURIComponent(escapeJsonPointer(str))
}

function escapeJsonPointer(str) {
  return str.replace(/~/g, "~0").replace(/\//g, "~1")
}

function unescapeJsonPointer(str) {
  return str.replace(/~1/g, "/").replace(/~0/g, "~")
}
