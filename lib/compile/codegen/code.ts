export class _Code {
  private _str: string

  constructor(s: string) {
    this._str = s
  }

  toString(): string {
    return this._str
  }

  isQuoted(): boolean {
    const len = this._str.length
    return len >= 2 && this._str[0] === '"' && this._str[len - 1] === '"'
  }

  add(c: _Code): void {
    this._str += c._str
  }
}

export const IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i

export class Name extends _Code {
  constructor(s: string) {
    super(s)
    if (!IDENTIFIER.test(s)) throw new Error("CodeGen: name must be a valid identifier")
  }

  isQuoted(): boolean {
    return false
  }

  add(_c: _Code): void {
    throw new Error("CodeGen: can't add to Name")
  }
}

export type Code = _Code | Name

export type SafeExpr = Code | number | boolean | null

export const nil = new _Code("")

type TemplateArg = SafeExpr | string | undefined

export function _(strs: TemplateStringsArray, ...args: TemplateArg[]): _Code {
  // TODO benchmark if loop is faster than reduce
  // let res = strs[0]
  // for (let i = 0; i < args.length; i++) {
  //   res += interpolate(args[i]) + strs[i + 1]
  // }
  // return new _Code(res)
  return new _Code(strs.reduce((res, s, i) => `${res}${interpolate(args[i - 1])}${s}`))
}

export function str(strs: TemplateStringsArray, ...args: (TemplateArg | string[])[]): _Code {
  return new _Code(
    strs.map(safeStringify).reduce((res, s, i) => {
      let aStr = interpolateStr(args[i - 1])
      if (aStr instanceof _Code && aStr.isQuoted()) aStr = aStr.toString()
      return typeof aStr === "string"
        ? res.slice(0, -1) + aStr.slice(1, -1) + s.slice(1)
        : `${res} + ${aStr} + ${s}`
    })
  )
}

function interpolate(x: TemplateArg): TemplateArg {
  return x instanceof _Code || typeof x == "number" || typeof x == "boolean" || x === null
    ? x
    : safeStringify(x)
}

function interpolateStr(x: TemplateArg | string[]): TemplateArg {
  if (Array.isArray(x)) x = x.join(",")
  return interpolate(x)
}

export function stringify(x: unknown): Code {
  return new _Code(safeStringify(x))
}

function safeStringify(x: unknown): string {
  return JSON.stringify(x)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

export function getProperty(key: Code | string | number): Code {
  return typeof key == "string" && IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`
}
