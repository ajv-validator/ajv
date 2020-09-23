export class _Code {
  private readonly _str: string

  constructor(s: string) {
    this._str = s
  }

  toString(): string {
    return this._str
  }

  emptyStr(): boolean {
    return this._str === "" || this._str === '""'
  }
}

export const IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i

export class Name extends _Code {
  constructor(s: string) {
    super(s)
    if (!IDENTIFIER.test(s)) throw new Error("CodeGen: name must be a valid identifier")
  }

  emptyStr(): boolean {
    return false
  }
}

export type Code = _Code | Name

export type SafeExpr = Code | number | boolean | null

export const nil = new _Code("")

type TemplateArg = SafeExpr | string | undefined

export function _(strs: TemplateStringsArray, ...args: TemplateArg[]): _Code {
  return new _Code(strs.reduce((res, s, i) => `${res}${interpolate(args[i - 1])}${s}`))
}

export function str(strs: TemplateStringsArray, ...args: (TemplateArg | string[])[]): _Code {
  return new _Code(
    strs
      .map(safeStringify)
      .reduce((res, s, i) => concat(concat(res, interpolateStr(args[i - 1])), s))
  )
}

function concat(s: string, a: string | number | boolean | null | undefined): string {
  return a === '""'
    ? s
    : s === '""'
    ? `${a}`
    : typeof a != "string"
    ? `${s.slice(0, -1)}${a}"`
    : s.endsWith('"') && a[0] === '"'
    ? s.slice(0, -1) + a.slice(1)
    : `${s} + ${a}`
}

export function strConcat(c1: Code, c2: Code): Code {
  return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`
}

function interpolate(x: TemplateArg): TemplateArg {
  return x instanceof _Code || typeof x == "number" || typeof x == "boolean" || x === null
    ? x
    : safeStringify(x)
}

function interpolateStr(x: TemplateArg | string[]): string | number | boolean | null | undefined {
  if (Array.isArray(x)) x = x.join(",")
  x = interpolate(x)
  return x instanceof _Code ? x.toString() : x
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
