enum BlockKind {
  If,
  Else,
  For,
  Func,
}

export type Expression = string | Name | Code

export type Value = string | Name | Code | number | boolean | null

export type Block = string | Name | Code | (() => void)

export class Code {
  _str: string

  constructor(name: string) {
    this._str = name
  }

  toString(): string {
    return this._str
  }

  isQuoted(): boolean {
    const len = this._str.length
    return len >= 2 && this._str[0] === '"' && this._str[len - 1] === '"'
  }
}

export const nil = new Code("")

export class Name extends Code {}

const varKinds = {
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

type ValueReference = any // possibly make CodeGen parameterized type on this type

export interface NameValue {
  ref: ValueReference // this is the reference to any value that can be referred to from generated code via `globals` var in the closure
  key?: unknown // any key to identify a global to avoid duplicates, if not passed ref is used
  code?: Code // this is the code creating the value needed for standalone code without closure - can be a primitive value, function or import (`require`)
}

export interface ValueStore {
  [prefix: string]: ValueReference[]
}

type TemplateArg = Expression | number | boolean

export class ValueError extends Error {
  value: NameValue
  constructor({name, value}: NameRec) {
    super(`CodeGen: code for ${name} not defined`)
    this.value = value
  }
}

export function _(strs: TemplateStringsArray, ...args: TemplateArg[]): Code {
  return new Code(strs.reduce((res, s, i) => res + interpolate(args[i - 1]) + s))
}

// TODO this is unsafe tagged template that should be removed later
export function $(strs: TemplateStringsArray, ...args: TemplateArg[]): Code {
  return new Code(strs.reduce((res, s, i) => res + args[i - 1] + s))
}

export function str(strings: TemplateStringsArray, ...args: TemplateArg[]): Code {
  return new Code(
    strings.map(quoteString).reduce((res, s, i) => {
      let aStr = interpolate(args[i - 1])
      if (aStr instanceof Code && aStr.isQuoted()) aStr = aStr.toString()
      return typeof aStr === "string"
        ? res.slice(0, -1) + aStr.slice(1, -1) + s.slice(1)
        : `${res} + ${aStr} + ${s}`
    })
  )
}

function interpolate(x: TemplateArg): TemplateArg {
  return x instanceof Code || typeof x == "number" || typeof x == "boolean" ? x : quoteString(x)
}

const IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i

export default class CodeGen {
  #names: {[prefix: string]: NameGroup} = {}
  #valuePrefixes: {[prefix: string]: Name} = {}
  // TODO make private. Possibly stack?
  _out = ""
  #blocks: BlockKind[] = []
  #blockStarts: number[] = []

  toString(): string {
    return this._out
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
    const {ref, key} = value
    const ng = this._nameGroup(prefix)
    this.#valuePrefixes[prefix] = new Name(prefix)
    if (!ng.values) {
      ng.values = new Map()
    } else {
      const rec = ng.values.get(key || ref)
      if (rec) return rec.name
    }
    const name = this._name(ng)
    ng.values.set(key || ref, {name, value})
    return name
  }

  valuesClosure(valuesName: Name, store: ValueStore): Code {
    return this._reduceValues(({value: {ref}}, prefix, i) => {
      if (!store[prefix]) store[prefix] = []
      store[prefix][i] = ref
      const prefName = this.#valuePrefixes[prefix]
      return _`${valuesName}.${prefName}[${i}]`
    })
  }

  valuesCode(): Code {
    return this._reduceValues((rec: NameRec) => {
      const c = rec.value.code
      if (!c) throw new ValueError(rec)
      return c
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

  _def(varKind: Name, nameOrPrefix: Name | string, rhs?: Expression | number | boolean): Name {
    const name = nameOrPrefix instanceof Name ? nameOrPrefix : this.name(nameOrPrefix)
    if (rhs === undefined) this.code(`${varKind} ${name};`)
    else this.code(`${varKind} ${name} = ${rhs};`)
    return name
  }

  const(nameOrPrefix: Name | string, rhs?: Expression | number | boolean): Name {
    return this._def(varKinds.const, nameOrPrefix, rhs)
  }

  let(nameOrPrefix: Name | string, rhs?: Expression | number | boolean): Name {
    return this._def(varKinds.let, nameOrPrefix, rhs)
  }

  var(nameOrPrefix: Name | string, rhs?: Expression | number | boolean): Name {
    return this._def(varKinds.var, nameOrPrefix, rhs)
  }

  assign(name: Expression, rhs: Value): CodeGen {
    this.code(`${name} = ${rhs};`)
    return this
  }

  prop(name: Code, key: Expression | number): Code {
    name = name instanceof Name ? name : _`(${name})`
    return typeof key == "string" && IDENTIFIER.test(key) ? _`${name}.${key}` : _`${name}[${key}]`
  }

  code(c?: Block | Value): CodeGen {
    // TODO optionally strip whitespace
    if (typeof c == "function") c()
    else if (c !== undefined) this._out += c + "\n" // TODO fails without line breaks
    return this
  }

  if(condition: Expression | boolean, thenBody?: Block, elseBody?: Block): CodeGen {
    this.#blocks.push(BlockKind.If)
    this.code(`if(${condition}){`)
    if (thenBody && elseBody) {
      this.code(thenBody).else().code(elseBody).endIf()
    } else if (thenBody) {
      this.code(thenBody).endIf()
    } else if (elseBody) {
      throw new Error("CodeGen: else body without then body")
    }
    return this
  }

  ifNot(condition: Expression | boolean, thenBody?: Block, elseBody?: Block): CodeGen {
    const cond = condition instanceof Name ? condition : `(${condition})`
    return this.if(`!${cond}`, thenBody, elseBody)
  }

  elseIf(condition: Expression): CodeGen {
    if (this._lastBlock !== BlockKind.If) throw new Error('CodeGen: "else if" without "if"')
    this.code(`}else if(${condition}){`)
    return this
  }

  else(): CodeGen {
    if (this._lastBlock !== BlockKind.If) throw new Error('CodeGen: "else" without "if"')
    this._lastBlock = BlockKind.Else
    this.code(`}else{`)
    return this
  }

  endIf(): CodeGen {
    // TODO possibly remove empty branches here
    const b = this._lastBlock
    if (b !== BlockKind.If && b !== BlockKind.Else) throw new Error('CodeGen: "endIf" without "if"')
    this.#blocks.pop()
    this.code(`}`)
    return this
  }

  for(iteration: string | Code, forBody?: Block): CodeGen {
    this.#blocks.push(BlockKind.For)
    this.code(`for(${iteration}){`)
    if (forBody) this.code(forBody).endFor()
    return this
  }

  endFor(): CodeGen {
    const b = this._lastBlock
    if (b !== BlockKind.For) throw new Error('CodeGen: "endFor" without "for"')
    this.#blocks.pop()
    this.code(`}`)
    return this
  }

  break(label?: Code): CodeGen {
    this.code(label ? _`break ${label};` : _`break;`)
    return this
  }

  return(value: Block | Value): CodeGen {
    this._out += "return "
    this.code(value)
    this._out += ";"
    return this
  }

  try(tryBody: Block, catchCode?: (e: Name) => void, finallyCode?: Block): CodeGen {
    if (!catchCode && !finallyCode) throw new Error('CodeGen: "try" without "catch" and "finally"')
    this.code("try{").code(tryBody)
    if (catchCode) {
      const err = this.name("e")
      this.code(`}catch(${err}){`)
      catchCode(err)
    }
    if (finallyCode) this.code("}finally{").code(finallyCode)
    this.code("}")
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
    if (toClose > 0) this.code("}".repeat(toClose))
    return this
  }

  func(name: Name, args: Code = nil, async?: boolean, funcBody?: Block): CodeGen {
    this.#blocks.push(BlockKind.Func)
    this.code(`${async ? "async " : ""}function ${name}(${args}){`)
    if (funcBody) this.code(funcBody).endFunc()
    return this
  }

  endFunc(): CodeGen {
    const b = this._lastBlock
    if (b !== BlockKind.Func) throw new Error('CodeGen: "endFunc" without "func"')
    this.#blocks.pop()
    this.code(`}`)
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

export function quoteString(s: string): string {
  return JSON.stringify(s)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}
