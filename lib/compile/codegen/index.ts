import type {ScopeValueSets, NameValue, ValueScope, ValueScopeName} from "./scope"
import {_, nil, _Code, Code, Name} from "./code"
import {Scope} from "./scope"

export {_, str, strConcat, nil, getProperty, stringify, Name, Code} from "./code"
export {Scope, ScopeStore, ValueScope} from "./scope"

// type for expressions that can be safely inserted in code without quotes
export type SafeExpr = Code | number | boolean | null

// type that is either Code of function that adds code to CodeGen instance using its methods
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
  ownProperties?: boolean
  optimize?: boolean
}

enum Node {
  AnyCode,
  Def,
  Assign,
  Label,
  Break,
  Throw,
  Root,
  If = "if",
  Else = "else",
  For = "for",
  Func = "func",
  Return = "return",
  Try = "try",
  Catch = "catch",
  Finally = "finally",
}

interface _Node {
  kind: Node
}

interface DefNode extends _Node {
  kind: Node.Def
  varKind: Name
  name: Name
  rhs?: SafeExpr
}

interface AssignNode extends _Node {
  kind: Node.Assign
  lhs: Code
  rhs: SafeExpr
}

interface LabelNode extends _Node {
  kind: Node.Label
  label: Name
}

interface BreakNode extends _Node {
  kind: Node.Break
  label?: Code
}

interface ThrowNode extends _Node {
  kind: Node.Throw
  error: Code
}

interface CodeNode extends _Node {
  kind: Node.AnyCode
  code: SafeExpr
}

interface _ParentNode extends _Node {
  nodes: AnyNode[]
}

interface RootNode extends _ParentNode {
  kind: Node.Root
}

interface IfNode extends _ParentNode {
  kind: Node.If
  condition: Code | boolean
  else?: IfNode | ElseNode
}

interface ElseNode extends _ParentNode {
  kind: Node.Else
}

interface ForNode extends _ParentNode {
  kind: Node.For
  iteration: Code
}

interface FuncNode extends _ParentNode {
  kind: Node.Func
  name: Name
  args: Code
  async?: boolean
}

interface ReturnNode extends _ParentNode {
  kind: Node.Return
}

interface TryNode extends _ParentNode {
  kind: Node.Try
  catch?: CatchNode
  finally?: FinallyNode
}

interface CatchNode extends _ParentNode {
  kind: Node.Catch
  error: Name
  finally?: FinallyNode
}

interface FinallyNode extends _ParentNode {
  kind: Node.Finally
}

type BlockNode = IfNode | ForNode | FuncNode | ReturnNode | TryNode | CatchNode | FinallyNode

type ParentNode = RootNode | BlockNode | ElseNode

type AnyNode = ParentNode | DefNode | AssignNode | LabelNode | BreakNode | ThrowNode | CodeNode

export class CodeGen {
  readonly _scope: Scope
  readonly _extScope: ValueScope
  readonly _values: ScopeValueSets = {}
  private readonly _nodes: ParentNode[]
  private readonly _blockStarts: number[] = []
  private readonly opts: CodeGenOptions
  private readonly _n: string
  _render: boolean
  private _out = ""

  constructor(extScope: ValueScope, opts: CodeGenOptions = {}) {
    this.opts = opts
    this._extScope = extScope
    this._scope = new Scope({parent: extScope})
    this._nodes = [{kind: Node.Root, nodes: []}]
    this._render = !(opts.optimize ?? true)
    this._n = opts.lines ? "\n" : ""
  }

  toString(): string {
    if (!this._render) this._nodeCode(this._nodes[0])
    return this._out
  }

  // returns unique name in the internal scope
  name(prefix: string): Name {
    return this._scope.name(prefix)
  }

  // reserves unique name in the external scope
  scopeName(prefix: string): ValueScopeName {
    return this._extScope.name(prefix)
  }

  // reserves unique name in the external scope and assigns value to it
  scopeValue(prefixOrName: ValueScopeName | string, value: NameValue): Name {
    const name = this._extScope.value(prefixOrName, value)
    const vs = this._values[name.prefix] || (this._values[name.prefix] = new Set())
    vs.add(name)
    return name
  }

  getScopeValue(prefix: string, keyOrRef: unknown): ValueScopeName | void {
    return this._extScope.getValue(prefix, keyOrRef)
  }

  // return code that assigns values in the external scope to the names that are used internally
  // (same names that were returned by gen.scopeName or gen.scopeValue)
  scopeRefs(scopeName: Name): Code {
    return this._extScope.scopeRefs(scopeName, this._values)
  }

  scopeCode(): Code {
    return this._extScope.scopeCode(this._values)
  }

  private _def(varKind: Name, nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
    const name = this._scope.toName(nameOrPrefix)
    const node: DefNode = {kind: Node.Def, varKind, name, rhs}
    if (this._render) this._defCode(node)
    else this._currNode.nodes.push(node)
    return name
  }

  private _defCode({varKind, name, rhs}: DefNode): void {
    if (this.opts.es5) varKind = varKinds.var
    if (rhs === undefined) this._out += `${varKind} ${name};` + this._n
    else this._out += `${varKind} ${name} = ${rhs};` + this._n
  }

  // `const` declaration (`var` in es5 mode)
  const(nameOrPrefix: Name | string, rhs: SafeExpr): Name {
    return this._def(varKinds.const, nameOrPrefix, rhs)
  }

  // `let` declaration with optional assignment (`var` in es5 mode)
  let(nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
    return this._def(varKinds.let, nameOrPrefix, rhs)
  }

  // `var` declaration with optional assignment
  var(nameOrPrefix: Name | string, rhs?: SafeExpr): Name {
    return this._def(varKinds.var, nameOrPrefix, rhs)
  }

  // assignment code
  assign(lhs: Code, rhs: SafeExpr): CodeGen {
    const node: AssignNode = {kind: Node.Assign, lhs, rhs}
    if (this._render) this._assignCode(node)
    else this._currNode.nodes.push(node)
    return this
  }

  private _assignCode({lhs, rhs}: AssignNode): void {
    this._out += `${lhs} = ${rhs};` + this._n
  }

  // appends passed SafeExpr to code or executes Block
  code(c: Block | SafeExpr): CodeGen {
    if (typeof c == "function") c()
    else if (this._render) this._code(c)
    else this._currNode.nodes.push({kind: Node.AnyCode, code: c})
    return this
  }

  private _code(c: SafeExpr): void {
    this._out += `${c};${this._n}`
  }

  // returns code for object literal for the passed argument list of key-value pairs
  object(...keyValues: [Name, SafeExpr][]): _Code {
    const values = keyValues
      .map(([key, value]) => (key === value && !this.opts.es5 ? key : `${key}:${value}`))
      .reduce((c1, c2) => `${c1},${c2}`)
    return new _Code(`{${values}}`)
  }

  // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
  if(condition: Code | boolean, thenBody?: Block, elseBody?: Block): CodeGen {
    if (this._render) this._ifCode(condition)
    this._blockNode({kind: Node.If, condition, nodes: []})

    if (thenBody && elseBody) {
      this.code(thenBody).else().code(elseBody).endIf()
    } else if (thenBody) {
      this.code(thenBody).endIf()
    } else if (elseBody) {
      throw new Error('CodeGen: "else" body without "then" body')
    }
    return this
  }

  private _ifCode(condition: Code | boolean): void {
    this._out += `if(${condition})`
  }

  // `if` clause or statement with negated condition,
  // useful to avoid using _ template just to negate the name
  ifNot(condition: Code, thenBody?: Block, elseBody?: Block): CodeGen {
    const cond = new _Code(condition instanceof Name ? `!${condition}` : `!(${condition})`)
    return this.if(cond, thenBody, elseBody)
  }

  // `else if` clause - invalid without `if` or after `else` clauses
  elseIf(condition: Code | boolean): CodeGen {
    return this._startElseNode({kind: Node.If, condition, nodes: []})
  }

  // `else` clause - only valid after `if` or `else if` clauses
  else(): CodeGen {
    return this._startElseNode({kind: Node.Else, nodes: []})
  }

  // the termination of `if` statement - checks and updates the stack of previous clauses
  endIf(): CodeGen {
    return this._endBlockNode(Node.If, Node.Else)
  }

  private _blockNode(node: BlockNode, block = true): void {
    this._currNode.nodes.push(node)
    this._nodes.push(node)
    if (this._render && block) this._out += "{" + this._n
  }

  private _endBlockNode(n1: Node, n2?: Node | boolean): CodeGen {
    // TODO possibly remove empty branches here
    const {kind} = this._currNode
    if (kind !== n1 && kind !== n2) {
      throw new Error(`CodeGen: not in block "${n2 ? `${n1}/${n2}` : n1}"`)
    }
    this._nodes.pop()
    if (this._render && n2 !== false) this._out += "}" + this._n
    return this
  }

  private _startElseNode(node: IfNode | ElseNode): CodeGen {
    const n = this._currNode
    if (n.kind !== Node.If) {
      throw new Error('CodeGen: "else" without "if"')
    }
    this._currNode = n.else = node
    if (this._render) {
      this._out += "}else "
      if (node.kind === Node.If) this._ifCode(node.condition)
      this._out += "{" + this._n
    }
    return this
  }

  // a generic `for` clause (or statement if `forBody` is passed)
  for(iteration: Code, forBody?: Block): CodeGen {
    if (this._render) this._forCode(iteration)
    this._blockNode({kind: Node.For, iteration, nodes: []})

    if (forBody) this.code(forBody).endFor()
    return this
  }

  private _forCode(iteration: Code): void {
    this._out += `for(${iteration})`
  }

  // `for` statement for a range of values
  forRange(
    nameOrPrefix: Name | string,
    from: SafeExpr,
    to: SafeExpr,
    forBody: (index: Name) => void,
    varKind: Code = varKinds.let
  ): CodeGen {
    const i = this._scope.toName(nameOrPrefix)
    if (this.opts.es5) varKind = varKinds.var
    return this.for(_`${varKind} ${i}=${from}; ${i}<${to}; ${i}++`, () => forBody(i))
  }

  // `for-of` statement (in es5 mode replace with a normal for loop)
  forOf(
    nameOrPrefix: Name | string,
    iterable: SafeExpr,
    forBody: (item: Name) => void,
    varKind: Code = varKinds.const
  ): CodeGen {
    const name = this._scope.toName(nameOrPrefix)
    if (this.opts.es5) {
      const arr = iterable instanceof Name ? iterable : this.var("_arr", iterable)
      return this.forRange("_i", 0, new _Code(`${arr}.length`), (i) => {
        this.var(name, new _Code(`${arr}[${i}]`))
        forBody(name)
      })
    }
    return this.for(_`${varKind} ${name} of ${iterable}`, () => forBody(name))
  }

  // `for-in` statement.
  // With option `ownProperties` replaced with a `for-of` loop for object keys
  forIn(
    nameOrPrefix: Name | string,
    obj: SafeExpr,
    forBody: (item: Name) => void,
    varKind: Code = varKinds.const
  ): CodeGen {
    if (this.opts.ownProperties) {
      return this.forOf(nameOrPrefix, new _Code(`Object.keys(${obj})`), forBody)
    }
    const name = this._scope.toName(nameOrPrefix)
    return this.for(_`${varKind} ${name} in ${obj}`, () => forBody(name))
  }

  // render closing brace for `for` loop - checks and updates the stack of previous clauses
  endFor(): CodeGen {
    return this._endBlockNode(Node.For)
  }

  // render `label` clause
  label(label: Name): CodeGen {
    if (this._render) this._labelCode(label)
    else this._currNode.nodes.push({kind: Node.Label, label})
    return this
  }

  private _labelCode(label: Name): void {
    this._out += `${label}:${this._n}`
  }

  // render `break` statement
  break(label?: Code): CodeGen {
    if (this._render) this._breakCode(label)
    else this._currNode.nodes.push({kind: Node.Break, label})
    return this
  }

  private _breakCode(label?: Code): void {
    this._out += (label ? `break ${label};` : "break;") + this._n
  }

  // render `return` statement
  return(value: Block | SafeExpr): CodeGen {
    this._blockNode({kind: Node.Return, nodes: []}, false)
    if (this._render) this._out += "return "
    this.code(value)
    return this._endBlockNode(Node.Return, false)
  }

  // render `try` statement
  try(tryBody: Block, catchCode?: (e: Name) => void, finallyCode?: Block): CodeGen {
    if (!catchCode && !finallyCode) throw new Error('CodeGen: "try" without "catch" and "finally"')
    let node: TryNode | CatchNode = {kind: Node.Try, nodes: []}
    if (this._render) this._out += "try"
    this._blockNode(node)
    this.code(tryBody)
    if (catchCode) {
      const error = this.name("e")
      node = this._currNode = node.catch = {kind: Node.Catch, error, nodes: []}
      if (this._render) {
        this._out += `}catch(${error}){` + this._n
      }
      catchCode(error)
    }
    if (finallyCode) {
      this._currNode = node.finally = {kind: Node.Finally, nodes: []}
      if (this._render) this._out += "}finally{" + this._n
      this.code(finallyCode)
    }
    this._endBlockNode(Node.Catch, Node.Finally)
    return this
  }

  private _catchCode({error}: CatchNode): void {
    this._out += `catch(${error})`
  }

  // render `throw` statement
  throw(error: Code): CodeGen {
    if (this._render) this._throwCode(error)
    else this._currNode.nodes.push({kind: Node.Throw, error})
    return this
  }

  private _throwCode(error: Code): void {
    this._out += `throw ${error};` + this._n
  }

  // start self-balancing block
  block(body?: Block, nodeCount?: number): CodeGen {
    this._blockStarts.push(this._nodes.length)
    if (body) this.code(body).endBlock(nodeCount)
    return this
  }

  // render braces to balance them until the previous gen.block call
  endBlock(nodeCount?: number): CodeGen {
    // TODO maybe close blocks one by one, eliminating empty branches
    const len = this._blockStarts.pop()
    if (len === undefined) throw new Error("CodeGen: not in self-balancing block")
    const toClose = this._nodes.length - len
    if (toClose < 0 || (nodeCount !== undefined && toClose !== nodeCount)) {
      throw new Error(`CodeGen: wrong number of block nodes: ${toClose} vs ${nodeCount} expected`)
    }
    this._nodes.length = len

    if (this._render && toClose > 0) this._out += "}".repeat(toClose) + this._n

    return this
  }

  // render `function` head (or definition if funcBody is passed)
  func(name: Name, args: Code = nil, async?: boolean, funcBody?: Block): CodeGen {
    const node: FuncNode = {kind: Node.Func, name, args, async, nodes: []}
    if (this._render) this._funcCode(node)
    this._blockNode(node)

    if (funcBody) this.code(funcBody).endFunc()
    return this
  }

  private _funcCode({name, args = nil, async}: FuncNode): void {
    this._out += `${async ? "async " : ""}function ${name}(${args})`
  }

  // render closing brace for function definition
  endFunc(): CodeGen {
    return this._endBlockNode(Node.Func)
  }

  private _nodeCode(node: AnyNode): void {
    switch (node.kind) {
      case Node.Root:
        this._childrenCode(node, false)
        break
      case Node.If:
        this._ifCode(node.condition)
        this._childrenCode(node)
        if (node.else) {
          this._out += "else "
          this._nodeCode(node.else)
        }
        break
      case Node.Else:
        this._childrenCode(node)
        break
      case Node.For:
        this._forCode(node.iteration)
        this._childrenCode(node)
        break
      case Node.Func:
        this._funcCode(node)
        this._childrenCode(node)
        break
      case Node.Return:
        this._out += "return "
        this._childrenCode(node, false)
        break
      case Node.Try:
        this._out += "try"
        this._childrenCode(node)
        if (node.catch) this._nodeCode(node.catch)
        if (node.finally) this._nodeCode(node.finally)
        break
      case Node.Catch:
        this._catchCode(node)
        this._childrenCode(node)
        if (node.finally) this._nodeCode(node.finally)
        break
      case Node.Finally:
        this._out += "finally"
        this._childrenCode(node)
        break
      case Node.Def:
        this._defCode(node)
        break
      case Node.Assign:
        this._assignCode(node)
        break
      case Node.Label:
        this._labelCode(node.label)
        break
      case Node.Break:
        this._breakCode(node.label)
        break
      case Node.Throw:
        this._throwCode(node.error)
        break
      case Node.AnyCode:
        this._code(node.code)
        break
      default:
        throw new Error("ajv implementation error")
    }
  }

  private _childrenCode(node: ParentNode, block = true): void {
    if (block) this._out += "{" + this._n
    node.nodes.forEach((n) => this._nodeCode(n))
    if (block) this._out += "}" + this._n
  }

  private get _currNode(): ParentNode {
    const ns = this._nodes
    return ns[ns.length - 1]
  }

  private set _currNode(node: ParentNode) {
    const ns = this._nodes
    ns[ns.length - 1] = node
  }
}

const andCode = mappend(operators.AND)

// boolean AND (&&) expression with the passed arguments
export function and(...args: Code[]): Code {
  return args.reduce(andCode)
}

const orCode = mappend(operators.OR)

// boolean OR (||) expression with the passed arguments
export function or(...args: Code[]): Code {
  return args.reduce(orCode)
}

type MAppend = (x: Code, y: Code) => Code

function mappend(op: Code): MAppend {
  return (x, y) => (x === nil ? y : y === nil ? x : new _Code(`${x} ${op} ${y}`))
}
