import {_} from "../compile/codegen"

const rxParseJson = /position\s(\d+)$/

export function parseJson(s: string, pos: number): [unknown, number] {
  let endPos: number | undefined
  if (pos) s = s.slice(pos)
  try {
    return [JSON.parse(s), pos + s.length]
  } catch (e) {
    const matches = rxParseJson.exec(e.message)
    if (!matches) throw e
    endPos = +matches[1]
    s = s.slice(0, endPos)
    return [JSON.parse(s), pos + endPos]
  }
}

parseJson.code = _`require("ajv/dist/runtime/parseJson").parseJson`

export function parseJsonNumber(s: string, pos: number, maxDigits?: number): [number, number] {
  let numStr = ""
  let c: string
  if (s[pos] === "-") {
    numStr += "-"
    pos++
  }
  if (s[pos] === "0") {
    numStr += "0"
    pos++
  } else {
    parseDigits(maxDigits)
  }
  if (maxDigits) return [+numStr, pos]
  if (s[pos] === ".") {
    numStr += "."
    pos++
    parseDigits()
  }
  if (((c = s[pos]), c === "e" || c === "E")) {
    numStr += "e"
    pos++
    if (((c = s[pos]), c === "+" || c === "-")) {
      numStr += c
      pos++
    }
    parseDigits()
  }
  return [+numStr, pos]

  function parseDigits(maxLen?: number): void {
    let digit: boolean | undefined
    while (((c = s[pos]), c >= "0" && c <= "9" && (maxLen === undefined || maxLen-- > 0))) {
      digit = true
      numStr += c
      pos++
    }
    if (!digit) {
      if (pos < s.length) unexpectedToken(s[pos], pos)
      else unexpectedEnd()
    }
  }
}

parseJsonNumber.code = _`require("ajv/dist/runtime/parseJson").parseJsonNumber`

const escapedChars: {[X in string]?: string} = {
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
  '"': '"',
  "/": "/",
  "\\": "\\",
}

const A_CODE: number = "a".charCodeAt(0)

export function parseJsonString(s: string, pos: number): [string, number] {
  let str = ""
  let c: string | undefined
  // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
  while (true) {
    c = s[pos]
    pos++
    if (c === '"') break
    if (c === "\\") {
      c = s[pos]
      if (c in escapedChars) str += escapedChars[c]
      else if (c === "u") getCharCode()
      else unexpectedToken(c, pos)
      pos++
    } else if (c === undefined) {
      throw unexpectedEnd()
    } else {
      str += c
    }
  }
  return [str, pos]

  function getCharCode(): void {
    let count = 4
    let code = 0
    while (count--) {
      code <<= 4
      c = s[pos].toLowerCase()
      if (c >= "a" && c <= "f") {
        c += c.charCodeAt(0) - A_CODE + 10
      } else if (c >= "0" && c <= "9") {
        code += +c
      } else if (c === undefined) {
        unexpectedEnd()
      } else {
        unexpectedToken(c, pos)
      }
      pos++
    }
    str += String.fromCharCode(code)
  }
}

parseJsonString.code = _`require("ajv/dist/runtime/parseJson").parseJsonString`

export function skipWhitespace(s: string, pos: number): number {
  let c: string
  while (((c = s[pos]), c === " " || c === "\n" || c === "\r" || c === "\t")) pos++
  return pos
}

skipWhitespace.code = _`require("ajv/dist/runtime/parseJson").skipWhitespace`

function unexpectedEnd(): never {
  throw new SyntaxError("Unexpected end of JSON input")
}

function unexpectedToken(c: string, pos: number): never {
  throw new SyntaxError(`Unexpected token ${c} in JSON at position ${pos}`)
}
