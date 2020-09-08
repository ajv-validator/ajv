import {_, str, nil, _Code, Code, IDENTIFIER, Name, stringify} from "./code"
import {Scope, NameValue, _Scope} from "./scope"

export {_, str, nil, Name, Code, _Scope, stringify}

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

interface NameGroup {
  prefix: string
  index: number
  values?: Map<unknown, NameRec> // same key as passed in GlobalValue
}

interface NameRec {
  name: Name
  value: NameValue
}

export interface CodeGenOptions {
  es5?: boolean
  lines?: boolean
  forInOwn?: boolean
}

export class CodeGen {
  _scope = new Scope()
  _names: {[prefix: string]: NameGroup} = {}
  _valuePrefixes: {[prefix: string]: Name} = {}
  _out = ""
  _blocks: BlockKind[] = []
  _blockStarts: number[] = []
  _n = ""
  opts: CodeGenOptions

  constructor(opts: CodeGenOptions = {}) {
    this.opts = opts
    if (opts.lines) this._n = "\n"
  }

  toString(): string {
    return this._out
  }

  _toName(nameOrPrefix: Name | string): Name {
    return nameOrPrefix instanceof Name ? nameOrPrefix : this.name(nameOrPrefix)
  }

  name(prefix: string): Name {
    return this._scope.name(prefix)
  }

  // TODO move to global scope
  value(prefix: string, value: NameValue): Name {
    return this._scope.value(prefix, value)
  }

  _def(varKind: Name, nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
    const name = this._toName(nameOrPrefix)
    if (this.opts.es5) varKind = varKinds.var
    if (rhs === undefined) this._out += `${varKind} ${name};` + this._n
    else this._out += `${varKind} ${name} = ${rhs};` + this._n
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
      throw new Error('CodeGen: "else" body wit_out "then" body')
    }
    return this
  }

  ifNot(condition: Code, thenBody?: Block, elseBody?: Block): CodeGen {
    const cond = new _Code(condition instanceof Name ? `!${condition}` : `!(${condition})`)
    return this.if(cond, thenBody, elseBody)
  }

  elseIf(condition: Code): CodeGen {
    if (this._lastBlock !== BlockKind.If) throw new Error('CodeGen: "else if" wit_out "if"')
    this._out += `}else if(${condition}){` + this._n
    return this
  }

  else(): CodeGen {
    if (this._lastBlock !== BlockKind.If) throw new Error('CodeGen: "else" wit_out "if"')
    this._lastBlock = BlockKind.Else
    this._out += "}else{" + this._n
    return this
  }

  endIf(): CodeGen {
    // TODO possibly remove empty branches here
    const b = this._lastBlock
    if (b !== BlockKind.If && b !== BlockKind.Else) throw new Error('CodeGen: "endIf" wit_out "if"')
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
    this._blocks.push(BlockKind.For)
    this._out += forCode + this._n
    forBody(name)
    this.endFor()
    return this
  }

  endFor(): CodeGen {
    const b = this._lastBlock
    if (b !== BlockKind.For) throw new Error('CodeGen: "endFor" wit_out "for"')
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
    if (!catchCode && !finallyCode) throw new Error('CodeGen: "try" wit_out "catch" and "finally"')
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
    if (b !== BlockKind.Func) throw new Error('CodeGen: "endFunc" wit_out "func"')
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
