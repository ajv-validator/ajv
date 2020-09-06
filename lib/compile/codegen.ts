enum BlockKind {
  If,
  Else,
  For,
  Func,
}

export type SafeExpr = Code | number | boolean | null

export type Block = Code | (() => void)

export type Code = _Code | Name

class _Code {
  #str: string

  constructor(s: string) {
    this.#str = s
  }

  toString(): string {
    return this.#str
  }

  isQuoted(): boolean {
    const len = this.#str.length
    return len >= 2 && this.#str[0] === '"' && this.#str[len - 1] === '"'
  }

  add(c: _Code): void {
    this.#str += c.#str
  }
}

export const nil = new _Code("")

export const operators = {
  GT: new _Code(">"),
  GTE: new _Code(">="),
  LT: new _Code("<"),
  LTE: new _Code("<="),
  EQ: new _Code("==="),
  NEQ: new _Code("!=="),
  NOT: new _Code("!"),
  OR: new _Code("||"),
  AND: new _Code("&&"),
}

const IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i

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

export const varKinds = {
  const: new Name("const"),
  let: new Name("let"),
  var: new Name("var"),
}

interface NameGroup {
  prefix: string
  index: number
  values?: Map<unknown, NameRec> // same key as passed in GlobalValue
}

interface NameRec {
  name: Name
  value: NameValue
}

type ValueReference = unknown // possibly make CodeGen parameterized type on this type

export interface NameValue {
  ref?: ValueReference // this is the reference to any value that can be referred to from generated code via `globals` var in the closure
  key?: unknown // any key to identify a global to avoid duplicates, if not passed ref is used
  code?: Code // this is the code creating the value needed for standalone code without closure - can be a primitive value, function or import (`require`)
}

export interface Scope {
  [prefix: string]: ValueReference[]
}

type TemplateArg = SafeExpr | string

export class ValueError extends Error {
  value: NameValue
  constructor(fields: string, {name, value}: NameRec) {
    super(`CodeGen: ${fields} for ${name} not defined`)
    this.value = value
  }
}

export function _(strs: TemplateStringsArray, ...args: TemplateArg[]): _Code {
  // TODO benchmark if loop is faster than reduce
  // let res = strs[0]
  // for (let i = 0; i < args.length; i++) {
  //   res += interpolate(args[i]) + strs[i + 1]
  // }
  // return new _Code(res)
  return new _Code(strs.reduce((res, s, i) => res + interpolate(args[i - 1]) + s))
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

export interface CodeGenOptions {
  es5?: boolean
  lines?: boolean
  forInOwn?: boolean
}

export default class CodeGen {
  #names: {[prefix: string]: NameGroup} = {}
  #valuePrefixes: {[prefix: string]: Name} = {}
  #out = ""
  #blocks: BlockKind[] = []
  #blockStarts: number[] = []
  #n = ""
  opts: CodeGenOptions

  constructor(opts: CodeGenOptions = {}) {
    this.opts = opts
    if (opts.lines) this.#n = "\n"
  }

  toString(): string {
    return this.#out
  }

  _nameGroup(prefix: string): NameGroup {
    let ng = this.#names[prefix]
    if (!ng) ng = this.#names[prefix] = {prefix, index: 0}
    return ng
  }

  _name(ng: NameGroup): Name {
    return new Name(ng.prefix + ng.index++)
  }

  name(prefix: string): Name {
    const ng = this._nameGroup(prefix)
    return this._name(ng)
  }

  value(prefix: string, value: NameValue): Name {
    const {ref, key, code} = value
    const valueKey = key ?? ref ?? code
    if (!valueKey) throw new Error("CodeGen: ref or code must be passed in value")
    const ng = this._nameGroup(prefix)
    this.#valuePrefixes[prefix] = new Name(prefix)
    if (!ng.values) {
      ng.values = new Map()
    } else {
      const rec = ng.values.get(valueKey)
      if (rec) return rec.name
    }
    const name = this._name(ng)
    ng.values.set(valueKey, {name, value})
    return name
  }

  scopeRefs(scopeName: Name, scope: Scope): Code {
    return this._reduceValues((rec: NameRec, prefix: string, i: number) => {
      const {value: v} = rec
      if (v.ref) {
        if (!scope[prefix]) scope[prefix] = []
        scope[prefix][i] = v.ref
        const prefName = this.#valuePrefixes[prefix]
        return _`${scopeName}.${prefName}[${i}]`
      }
      if (v.code) return v.code
      throw new ValueError("ref and code", rec)
    })
  }

  scopeCode(): Code {
    return this._reduceValues((rec: NameRec) => {
      const c = rec.value.code
      if (c) return c
      throw new ValueError("code", rec)
    })
  }

  _reduceValues(valueCode: (n: NameRec, pref: string, index: number) => Code): Code {
    let code: Code = nil
    for (const prefix in this.#valuePrefixes) {
      let i = 0
      const values = this.#names[prefix].values
      if (!values) throw new Error("ajv implementation error")
      values.forEach((rec: NameRec) => {
        code = _`${code}const ${rec.name} = ${valueCode(rec, prefix, i++)};`
      })
    }
    return code
  }

  _toName(nameOrPrefix: Name | string): Name {
    return nameOrPrefix instanceof Name ? nameOrPrefix : this.name(nameOrPrefix)
  }

  _def(varKind: Name, nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
    const name = this._toName(nameOrPrefix)
    if (this.opts.es5) varKind = varKinds.var
    if (rhs === undefined) this.#out += `${varKind} ${name};` + this.#n
    else this.#out += `${varKind} ${name} = ${rhs};` + this.#n
    return name
  }

  const(nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
    return this._def(varKinds.const, nameOrPrefix, rhs)
  }

  let(nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
    return this._def(varKinds.let, nameOrPrefix, rhs)
  }

  var(nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
    return this._def(varKinds.var, nameOrPrefix, rhs)
  }

  assign(name: Code, rhs: SafeExpr): CodeGen {
    this.#out += `${name} = ${rhs};` + this.#n
    return this
  }

  code(c: Block | SafeExpr): CodeGen {
    if (typeof c == "function") c()
    else this.#out += c + ";" + this.#n

    return this
  }

  if(condition: Code | boolean, thenBody?: Block, elseBody?: Block): CodeGen {
    this.#blocks.push(BlockKind.If)
    this.#out += `if(${condition}){` + this.#n
    if (thenBody && elseBody) {
      this.code(thenBody).else().code(elseBody).endIf()
    } else if (thenBody) {
      this.code(thenBody).endIf()
    } else if (elseBody) {
      throw new Error('CodeGen: "else" body without "then" body')
    }
    return this
  }

  ifNot(condition: Code, thenBody?: Block, elseBody?: Block): CodeGen {
    const cond = new _Code(condition instanceof Name ? `!${condition}` : `!(${condition})`)
    return this.if(cond, thenBody, elseBody)
  }

  elseIf(condition: Code): CodeGen {
    if (this._lastBlock !== BlockKind.If) throw new Error('CodeGen: "else if" without "if"')
    this.#out += `}else if(${condition}){` + this.#n
    return this
  }

  else(): CodeGen {
    if (this._lastBlock !== BlockKind.If) throw new Error('CodeGen: "else" without "if"')
    this._lastBlock = BlockKind.Else
    this.#out += "}else{" + this.#n
    return this
  }

  endIf(): CodeGen {
    // TODO possibly remove empty branches here
    const b = this._lastBlock
    if (b !== BlockKind.If && b !== BlockKind.Else) throw new Error('CodeGen: "endIf" without "if"')
    this.#blocks.pop()
    this.#out += "}" + this.#n
    return this
  }

  for(iteration: Code, forBody?: Block): CodeGen {
    this.#blocks.push(BlockKind.For)
    this.#out += `for(${iteration}){` + this.#n
    if (forBody) this.code(forBody).endFor()
    return this
  }

  forOf(
    nameOrPrefix: Name | string,
    iterable: SafeExpr,
    forBody: (n: Name) => void,
    varKind: Code = varKinds.const
  ): CodeGen {
    const name = this._toName(nameOrPrefix)
    if (this.opts.es5) {
      const i = this.name("_i")
      return this._loop(
        new _Code(`for(${varKinds.let} ${i}=0; ${i}<${iterable}.length; ${i}++){`),
        i,
        () => {
          const item = new _Code(`${iterable}[${i}]`)
          this._def(varKind, name, item)
          forBody(name)
        }
      )
    }
    return this._loop(new _Code(`for(${varKind} ${name} of ${iterable}){`), name, forBody)
  }

  forIn(
    nameOrPrefix: Name | string,
    obj: SafeExpr,
    forBody: (n: Name) => void,
    varKind: Code = varKinds.const
  ): CodeGen {
    // TODO define enum for var kinds
    if (this.opts.forInOwn) {
      return this.forOf(nameOrPrefix, new _Code(`Object.keys(${obj})`), forBody)
    }
    const name = this._toName(nameOrPrefix)
    return this._loop(new _Code(`for(${varKind} ${name} in ${obj}){`), name, forBody)
  }

  _loop(forCode: _Code, name: Name, forBody: (n: Name) => void): CodeGen {
    this.#blocks.push(BlockKind.For)
    this.#out += forCode + this.#n
    forBody(name)
    this.endFor()
    return this
  }

  endFor(): CodeGen {
    const b = this._lastBlock
    if (b !== BlockKind.For) throw new Error('CodeGen: "endFor" without "for"')
    this.#blocks.pop()
    this.#out += "}" + this.#n
    return this
  }

  label(label?: Code): CodeGen {
    this.#out += label + ":" + this.#n
    return this
  }

  break(label?: Code): CodeGen {
    this.#out += (label ? `break ${label};` : "break;") + this.#n
    return this
  }

  return(value: Block | SafeExpr): CodeGen {
    this.#out += "return "
    this.code(value)
    this.#out += ";" + this.#n
    return this
  }

  try(tryBody: Block, catchCode?: (e: Name) => void, finallyCode?: Block): CodeGen {
    if (!catchCode && !finallyCode) throw new Error('CodeGen: "try" without "catch" and "finally"')
    this.#out += "try{" + this.#n
    this.code(tryBody)
    if (catchCode) {
      const err = this.name("e")
      this.#out += `}catch(${err}){` + this.#n
      catchCode(err)
    }
    if (finallyCode) {
      this.#out += "}finally{" + this.#n
      this.code(finallyCode)
    }
    this.#out += "}" + this.#n
    return this
  }

  throw(err: Code): CodeGen {
    this.#out += `throw ${err};` + this.#n
    return this
  }

  block(body?: Block, expectedToClose?: number): CodeGen {
    this.#blockStarts.push(this.#blocks.length)
    if (body) this.code(body).endBlock(expectedToClose)
    return this
  }

  endBlock(expectedToClose?: number): CodeGen {
    // TODO maybe close blocks one by one, eliminating empty branches
    const len = this.#blockStarts.pop()
    if (len === undefined) throw new Error("CodeGen: not in block sequence")
    const toClose = this.#blocks.length - len
    if (toClose < 0 || (expectedToClose !== undefined && toClose !== expectedToClose)) {
      throw new Error("CodeGen: block sequence already ended or incorrect number of blocks")
    }
    this.#blocks.length = len
    if (toClose > 0) this.#out += "}".repeat(toClose) + this.#n
    return this
  }

  func(name: Name, args: Code = nil, async?: boolean, funcBody?: Block): CodeGen {
    this.#blocks.push(BlockKind.Func)
    this.#out += `${async ? "async " : ""}function ${name}(${args}){` + this.#n
    if (funcBody) this.code(funcBody).endFunc()
    return this
  }

  endFunc(): CodeGen {
    const b = this._lastBlock
    if (b !== BlockKind.Func) throw new Error('CodeGen: "endFunc" without "func"')
    this.#blocks.pop()
    this.#out += "}" + this.#n
    return this
  }

  get _lastBlock(): BlockKind {
    return this.#blocks[this._last()]
  }

  set _lastBlock(b: BlockKind) {
    this.#blocks[this._last()] = b
  }

  _last(): number {
    const len = this.#blocks.length
    if (len === 0) throw new Error("CodeGen: not in block")
    return len - 1
  }
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

const andCode = mappend(operators.AND)

export function and(...args: Code[]): Code {
  return args.reduce(andCode)
}

const orCode = mappend(operators.OR)

export function or(...args: Code[]): Code {
  return args.reduce(orCode)
}

type MAppend = (x: Code, y: Code) => Code

function mappend(op: Code): MAppend {
  return (x, y) => (x === nil ? y : y === nil ? x : new _Code(`${x} ${op} ${y}`))
}
