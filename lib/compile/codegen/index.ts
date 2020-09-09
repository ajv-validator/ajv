import {_, str, nil, _Code, Code, IDENTIFIER, Name, stringify} from "./code"
import {Scope, ScopeValueSets, NameValue, ScopeStore, ValueScope} from "./scope"

export {_, str, nil, stringify, Name, Code, Scope, ScopeStore, ValueScope}

enum BlockKind {
  If,
  Else,
  For,
  Func,
}

export type SafeExpr = Code | number | boolean | null

export type Block = Code | (() => void)

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

export const varKinds = {
  const: new Name("const"),
  let: new Name("let"),
  var: new Name("var"),
}

export interface CodeGenOptions {
  es5?: boolean
  lines?: boolean
  forInOwn?: boolean
}

export class CodeGen {
  _scope: Scope
  _extScope: ValueScope
  _values: ScopeValueSets = {}
  _out = ""
  _blocks: BlockKind[] = []
  _blockStarts: number[] = []
  _n = ""
  opts: CodeGenOptions

  constructor(extScope: ValueScope, opts: CodeGenOptions = {}) {
    this.opts = opts
    this._extScope = extScope
    this._scope = new Scope({parent: extScope})
    if (opts.lines) this._n = "\n"
  }

  toString(): string {
    return this._out
  }

  toName(nameOrPrefix: Name | string): Name {
    return nameOrPrefix instanceof Name ? nameOrPrefix : this.name(nameOrPrefix)
  }

  name(prefix: string): Name {
    return this._scope.name(prefix)
  }

  scopeValue(prefix: string, value: NameValue): Name {
    const rec = this._extScope.value(prefix, value)
    if (!this._values[prefix]) this._values[prefix] = new Set()
    this._values[prefix].add(rec)
    return rec.name
  }

  scopeRefs(scopeName: Name): Code {
    return this._extScope.scopeRefs(scopeName, this._values)
  }

  const(nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
    return _def.call(this, varKinds.const, nameOrPrefix, rhs)
  }

  let(nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
    return _def.call(this, varKinds.let, nameOrPrefix, rhs)
  }

  var(nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
    return _def.call(this, varKinds.var, nameOrPrefix, rhs)
  }

  assign(name: Code, rhs: SafeExpr): CodeGen {
    this._out += `${name} = ${rhs};` + this._n
    return this
  }

  code(c: Block | SafeExpr): CodeGen {
    if (typeof c == "function") c()
    else this._out += c + ";" + this._n

    return this
  }

  if(condition: Code | boolean, thenBody?: Block, elseBody?: Block): CodeGen {
    this._blocks.push(BlockKind.If)
    this._out += `if(${condition}){` + this._n
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
    this._out += `}else if(${condition}){` + this._n
    return this
  }

  else(): CodeGen {
    if (this._lastBlock !== BlockKind.If) throw new Error('CodeGen: "else" without "if"')
    this._lastBlock = BlockKind.Else
    this._out += "}else{" + this._n
    return this
  }

  endIf(): CodeGen {
    // TODO possibly remove empty branches here
    const b = this._lastBlock
    if (b !== BlockKind.If && b !== BlockKind.Else) throw new Error('CodeGen: "endIf" without "if"')
    this._blocks.pop()
    this._out += "}" + this._n
    return this
  }

  for(iteration: Code, forBody?: Block): CodeGen {
    this._blocks.push(BlockKind.For)
    this._out += `for(${iteration}){` + this._n
    if (forBody) this.code(forBody).endFor()
    return this
  }

  forRange(
    nameOrPrefix: Name | string,
    from: SafeExpr,
    to: SafeExpr,
    forBody: (index: Name) => void,
    varKind: Code = varKinds.let
  ): CodeGen {
    const i = this.toName(nameOrPrefix)
    if (this.opts.es5) varKind = varKinds.var
    return _loop.call(this, _`for(${varKind} ${i}=${from}; ${i}<${to}; ${i}++){`, i, forBody)
  }

  forOf(
    nameOrPrefix: Name | string,
    iterable: SafeExpr,
    forBody: (item: Name) => void,
    varKind: Code = varKinds.const
  ): CodeGen {
    const name = this.toName(nameOrPrefix)
    if (this.opts.es5) {
      const arr = iterable instanceof Name ? iterable : this.var("arr", iterable)
      return this.forRange("_i", 0, new _Code(`${arr}.length`), (i) => {
        this.var(name, new _Code(`${arr}[${i}]`))
        forBody(name)
      })
    }
    return _loop.call(this, _`for(${varKind} ${name} of ${iterable}){`, name, forBody)
  }

  forIn(
    nameOrPrefix: Name | string,
    obj: SafeExpr,
    forBody: (item: Name) => void,
    varKind: Code = varKinds.const
  ): CodeGen {
    if (this.opts.forInOwn) {
      return this.forOf(nameOrPrefix, new _Code(`Object.keys(${obj})`), forBody)
    }
    const name = this.toName(nameOrPrefix)
    return _loop.call(this, _`for(${varKind} ${name} in ${obj}){`, name, forBody)
  }

  endFor(): CodeGen {
    const b = this._lastBlock
    if (b !== BlockKind.For) throw new Error('CodeGen: "endFor" without "for"')
    this._blocks.pop()
    this._out += "}" + this._n
    return this
  }

  label(label?: Code): CodeGen {
    this._out += label + ":" + this._n
    return this
  }

  break(label?: Code): CodeGen {
    this._out += (label ? `break ${label};` : "break;") + this._n
    return this
  }

  return(value: Block | SafeExpr): CodeGen {
    this._out += "return "
    this.code(value)
    this._out += ";" + this._n
    return this
  }

  try(tryBody: Block, catchCode?: (e: Name) => void, finallyCode?: Block): CodeGen {
    if (!catchCode && !finallyCode) throw new Error('CodeGen: "try" without "catch" and "finally"')
    this._out += "try{" + this._n
    this.code(tryBody)
    if (catchCode) {
      const err = this.name("e")
      this._out += `}catch(${err}){` + this._n
      catchCode(err)
    }
    if (finallyCode) {
      this._out += "}finally{" + this._n
      this.code(finallyCode)
    }
    this._out += "}" + this._n
    return this
  }

  throw(err: Code): CodeGen {
    this._out += `throw ${err};` + this._n
    return this
  }

  block(body?: Block, expectedToClose?: number): CodeGen {
    this._blockStarts.push(this._blocks.length)
    if (body) this.code(body).endBlock(expectedToClose)
    return this
  }

  endBlock(expectedToClose?: number): CodeGen {
    // TODO maybe close blocks one by one, eliminating empty branches
    const len = this._blockStarts.pop()
    if (len === undefined) throw new Error("CodeGen: not in block sequence")
    const toClose = this._blocks.length - len
    if (toClose < 0 || (expectedToClose !== undefined && toClose !== expectedToClose)) {
      throw new Error("CodeGen: block sequence already ended or incorrect number of blocks")
    }
    this._blocks.length = len
    if (toClose > 0) this._out += "}".repeat(toClose) + this._n
    return this
  }

  func(name: Name, args: Code = nil, async?: boolean, funcBody?: Block): CodeGen {
    this._blocks.push(BlockKind.Func)
    this._out += `${async ? "async " : ""}function ${name}(${args}){` + this._n
    if (funcBody) this.code(funcBody).endFunc()
    return this
  }

  endFunc(): CodeGen {
    const b = this._lastBlock
    if (b !== BlockKind.Func) throw new Error('CodeGen: "endFunc" without "func"')
    this._blocks.pop()
    this._out += "}" + this._n
    return this
  }

  get _lastBlock(): BlockKind {
    return this._blocks[this._last()]
  }

  set _lastBlock(b: BlockKind) {
    this._blocks[this._last()] = b
  }

  _last(): number {
    const len = this._blocks.length
    if (len === 0) throw new Error("CodeGen: not in block")
    return len - 1
  }
}

function _def(this: CodeGen, varKind: Name, nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
  const name = this.toName(nameOrPrefix)
  if (this.opts.es5) varKind = varKinds.var
  if (rhs === undefined) this._out += `${varKind} ${name};` + this._n
  else this._out += `${varKind} ${name} = ${rhs};` + this._n
  return name
}

function _loop(this: CodeGen, forCode: _Code, name: Name, forBody: (n: Name) => void): CodeGen {
  this._blocks.push(BlockKind.For)
  this._out += forCode + this._n
  forBody(name)
  this.endFor()
  return this
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
