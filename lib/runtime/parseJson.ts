import {_} from "../compile/codegen"

const rxParseJson = /position\s(\d+)$/

export function parseJson(s: string, pos: number): unknown {
  let endPos: number | undefined
  parseJson.message = undefined
  let matches: RegExpExecArray | null
  if (pos) s = s.slice(pos)
  try {
    parseJson.position = pos + s.length
    return JSON.parse(s)
  } catch (e) {
    matches = rxParseJson.exec(e.message)
    if (!matches) {
      parseJson.message = "unexpected end"
      return undefined
    }
    endPos = +matches[1]
    s = s.slice(0, endPos)
    parseJson.position = pos + endPos
    try {
      return JSON.parse(s)
    } catch (e1) {
      parseJson.message = `unexpected token ${s[endPos]}`
      return undefined
    }
  }
}

parseJson.message = undefined as string | undefined
parseJson.position = 0 as number
parseJson.code = _`require("ajv/dist/runtime/parseJson").parseJson`

export function parseJsonNumber(s: string, pos: number, maxDigits?: number): number | undefined {
  let numStr = ""
  let c: string
  parseJsonNumber.message = undefined
  if (s[pos] === "-") {
    numStr += "-"
    pos++
  }
  if (s[pos] === "0") {
    numStr += "0"
    pos++
  } else {
    if (!parseDigits(maxDigits)) {
      errorMessage()
      return undefined
    }
  }
  if (maxDigits) {
    parseJsonNumber.position = pos
    return +numStr
  }
  if (s[pos] === ".") {
    numStr += "."
    pos++
    if (!parseDigits()) {
      errorMessage()
      return undefined
    }
  }
  if (((c = s[pos]), c === "e" || c === "E")) {
    numStr += "e"
    pos++
    if (((c = s[pos]), c === "+" || c === "-")) {
      numStr += c
      pos++
    }
    if (!parseDigits()) {
      errorMessage()
      return undefined
    }
  }
  parseJsonNumber.position = pos
  return +numStr

  function parseDigits(maxLen?: number): boolean {
    let digit = false
    while (((c = s[pos]), c >= "0" && c <= "9" && (maxLen === undefined || maxLen-- > 0))) {
      digit = true
      numStr += c
      pos++
    }
    return digit
  }

  function errorMessage(): void {
    parseJson.message = pos < s.length ? `unexpected token ${s[pos]}` : "unexpected end"
  }
}

parseJsonNumber.message = undefined as string | undefined
parseJsonNumber.position = 0 as number
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

export function parseJsonString(s: string, pos: number): string | undefined {
  let str = ""
  let c: string | undefined
  parseJsonString.message = undefined
  // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
  while (true) {
    c = s[pos]
    pos++
    if (c === '"') break
    if (c === "\\") {
      c = s[pos]
      if (c in escapedChars) {
        str += escapedChars[c]
      } else if (c === "u") {
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
            errorMessage("unexpected end")
            return undefined
          } else {
            errorMessage(`unexpected token ${s[pos]}`)
            return undefined
          }
          pos++
        }
        str += String.fromCharCode(code)
      } else {
        errorMessage(`unexpected token ${s[pos]}`)
        return undefined
      }
      pos++
    } else if (c === undefined) {
      errorMessage("unexpected end")
      return undefined
    } else {
      str += c
    }
  }
  parseJsonString.position = pos
  return str

  function errorMessage(msg: string): void {
    parseJsonString.position = pos
    parseJsonString.message = msg
  }
}

parseJsonString.message = undefined as string | undefined
parseJsonString.position = 0 as number
parseJsonString.code = _`require("ajv/dist/runtime/parseJson").parseJsonString`
