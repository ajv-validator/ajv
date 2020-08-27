enum BlockKind {
  If,
  Else,
  For,
  Func,
}

export type Expression = string | Name | Code

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

type TemplateArg = Expression | number | boolean

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

export default class CodeGen {
  #names: {[key: string]: number} = {}
  // TODO make private. Possibly stack?
  _out = ""
  #blocks: BlockKind[] = []
  #blockStarts: number[] = []

  toString(): string {
    return this._out
  }

  name(prefix: string): Name {
    if (!this.#names[prefix]) this.#names[prefix] = 0
    const num = this.#names[prefix]++
    return new Name(`${prefix}_${num}`)
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

  assign(name: Expression, rhs: Expression | number | boolean): CodeGen {
    this.code(`${name} = ${rhs};`)
    return this
  }

  code(c?: Block): CodeGen {
    // TODO optionally strip whitespace
    if (typeof c == "function") c()
    else if (c) this._out += c + "\n"
    return this
  }

  if(condition: Expression, thenBody?: Block, elseBody?: Block): CodeGen {
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

  break(): CodeGen {
    this.code("break;")
    return this
  }

  return(value: Block): CodeGen {
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
