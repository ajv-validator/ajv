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

interface _TreeNode extends _Node {
  nodes: (BlockNode | LeafNode)[]
  block?: boolean
}

interface RootNode extends _TreeNode {
  kind: Node.Root
  block: false
}

interface IfNode extends _TreeNode {
  kind: Node.If
  condition: Code | boolean
  else?: IfNode | ElseNode
}

interface ElseNode extends _TreeNode {
  kind: Node.Else
}

interface ForNode extends _TreeNode {
  kind: Node.For
  iteration: Code
}

interface FuncNode extends _TreeNode {
  kind: Node.Func
  name: Name
  args: Code
  async?: boolean
}

interface ReturnNode extends _TreeNode {
  kind: Node.Return
  block: false
}

interface TryNode extends _TreeNode {
  kind: Node.Try
  catch?: CatchNode
  finally?: FinallyNode
}

interface CatchNode extends _TreeNode {
  kind: Node.Catch
  error: Name
  finally?: FinallyNode
}

interface FinallyNode extends _TreeNode {
  kind: Node.Finally
}

type BlockNode = IfNode | ForNode | FuncNode | ReturnNode | TryNode

type TreeNode = RootNode | BlockNode | ElseNode | CatchNode | FinallyNode

type LeafNode = DefNode | AssignNode | LabelNode | BreakNode | ThrowNode | CodeNode

export class CodeGen {
  readonly _scope: Scope
  readonly _extScope: ValueScope
  readonly _values: ScopeValueSets = {}
  private readonly _nodes: TreeNode[]
  private readonly _blockStarts: number[] = []
  private readonly opts: CodeGenOptions
  private readonly _n: string
  private _out = ""
  // nodeCount = 0

  constructor(extScope: ValueScope, opts: CodeGenOptions = {}) {
    this.opts = opts
    this._extScope = extScope
    this._scope = new Scope({parent: extScope})
    this._nodes = [{kind: Node.Root, nodes: [], block: false}]
    this._n = opts.lines ? "\n" : ""
  }

  toString(): string {
    this._out = ""
    this._nodeCode(this._nodes[0])
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
    this._leafNode({kind: Node.Def, varKind, name, rhs})
    return name
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
    return this._leafNode({kind: Node.Assign, lhs, rhs})
  }

  // appends passed SafeExpr to code or executes Block
  code(c: Block | SafeExpr): CodeGen {
    if (typeof c == "function") c()
    else this._leafNode({kind: Node.AnyCode, code: c})
    return this
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

  // `if` clause or statement with negated condition,
  // useful to avoid using _ template just to negate the name
  ifNot(condition: Code, thenBody?: Block, elseBody?: Block): CodeGen {
    const cond = new _Code(condition instanceof Name ? `!${condition}` : `!(${condition})`)
    return this.if(cond, thenBody, elseBody)
  }

  // `else if` clause - invalid without `if` or after `else` clauses
  elseIf(condition: Code | boolean): CodeGen {
    return this._elseNode({kind: Node.If, condition, nodes: []})
  }

  // `else` clause - only valid after `if` or `else if` clauses
  else(): CodeGen {
    return this._elseNode({kind: Node.Else, nodes: []})
  }

  // end `if` statement (needed if gen.if was used only with condition)
  endIf(): CodeGen {
    return this._endBlockNode(Node.If, Node.Else)
  }

  // a generic `for` clause (or statement if `forBody` is passed)
  for(iteration: Code, forBody?: Block): CodeGen {
    this._blockNode({kind: Node.For, iteration, nodes: []})
    if (forBody) this.code(forBody).endFor()
    return this
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

  // end `for` loop
  endFor(): CodeGen {
    return this._endBlockNode(Node.For)
  }

  // `label` statement
  label(label: Name): CodeGen {
    return this._leafNode({kind: Node.Label, label})
  }

  // `break` statement
  break(label?: Code): CodeGen {
    return this._leafNode({kind: Node.Break, label})
  }

  // `return` statement
  return(value: Block | SafeExpr): CodeGen {
    const node: ReturnNode = {kind: Node.Return, nodes: [], block: false}
    this._blockNode(node)
    this.code(value)
    if (node.nodes.length !== 1) throw new Error('CodeGen: "return" should have one node')
    return this._endBlockNode(Node.Return)
  }

  // `try` statement
  try(tryBody: Block, catchCode?: (e: Name) => void, finallyCode?: Block): CodeGen {
    if (!catchCode && !finallyCode) throw new Error('CodeGen: "try" without "catch" and "finally"')
    const tryNode: TryNode = {kind: Node.Try, nodes: []}
    this._blockNode(tryNode)
    this.code(tryBody)
    let node: TryNode | CatchNode = tryNode
    if (catchCode) {
      const error = this.name("e")
      node = this._currNode = node.catch = {kind: Node.Catch, error, nodes: []}
      catchCode(error)
    }
    if (finallyCode) {
      this._currNode = node.finally = {kind: Node.Finally, nodes: []}
      this.code(finallyCode)
    }
    return this._endBlockNode(Node.Catch, Node.Finally)
  }

  // `throw` statement
  throw(error: Code): CodeGen {
    return this._leafNode({kind: Node.Throw, error})
  }

  // start self-balancing block
  block(body?: Block, nodeCount?: number): CodeGen {
    this._blockStarts.push(this._nodes.length)
    if (body) this.code(body).endBlock(nodeCount)
    return this
  }

  // end the current self-balancing block
  endBlock(nodeCount?: number): CodeGen {
    const len = this._blockStarts.pop()
    if (len === undefined) throw new Error("CodeGen: not in self-balancing block")
    const toClose = this._nodes.length - len
    if (toClose < 0 || (nodeCount !== undefined && toClose !== nodeCount)) {
      throw new Error(`CodeGen: wrong number of block nodes: ${toClose} vs ${nodeCount} expected`)
    }
    this._nodes.length = len
    return this
  }

  // `function` heading (or definition if funcBody is passed)
  func(name: Name, args: Code = nil, async?: boolean, funcBody?: Block): CodeGen {
    this._blockNode({kind: Node.Func, name, args, async, nodes: []})
    if (funcBody) this.code(funcBody).endFunc()
    return this
  }

  // end function definition
  endFunc(): CodeGen {
    return this._endBlockNode(Node.Func)
  }

  optimize(): void {
    optimizeNodes(this._nodes[0].nodes)
  }

  private _leafNode(node: LeafNode): CodeGen {
    this._currNode.nodes.push(node)
    return this
  }

  private _blockNode(node: BlockNode): void {
    this._currNode.nodes.push(node)
    this._nodes.push(node)
  }

  private _endBlockNode(n1: Node, n2?: Node): CodeGen {
    const {kind} = this._currNode
    if (kind !== n1 && kind !== n2) {
      throw new Error(`CodeGen: not in block "${n2 ? `${n1}/${n2}` : n1}"`)
    }
    this._nodes.pop()
    return this
  }

  private _elseNode(node: IfNode | ElseNode): CodeGen {
    const n = this._currNode
    if (n.kind !== Node.If) {
      throw new Error('CodeGen: "else" without "if"')
    }
    this._currNode = n.else = node
    return this
  }

  private _nodeCode(node: TreeNode): void {
    // this.nodeCount++
    switch (node.kind) {
      case Node.If:
        this._out += `if(${node.condition})`
        this._blockCode(node)
        if (node.else) {
          this._out += "else "
          this._nodeCode(node.else)
        }
        return
      case Node.Try:
        this._out += "try"
        this._blockCode(node)
        if (node.catch) this._nodeCode(node.catch)
        if (node.finally) this._nodeCode(node.finally)
        return
      case Node.Catch:
        this._out += `catch(${node.error})`
        this._blockCode(node)
        if (node.finally) this._nodeCode(node.finally)
        return

      case Node.For:
        this._out += `for(${node.iteration})`
        break
      case Node.Func: {
        this._out += (node.async ? "async " : "") + `function ${node.name}(${node.args})`
        break
      }
      case Node.Return:
        this._out += "return "
        break
      case Node.Finally: {
        this._out += "finally"
        break
      }
      case Node.Root:
      case Node.Else:
        break
      default:
        throw new Error("ajv implementation error")
    }
    this._blockCode(node)
  }

  private _leafNodeCode(node: LeafNode): void {
    // this.nodeCount++
    let code: string
    switch (node.kind) {
      case Node.Def: {
        const varKind = this.opts.es5 ? varKinds.var : node.varKind
        code = `${varKind} ${node.name}` + (node.rhs === undefined ? ";" : ` = ${node.rhs};`)
        break
      }
      case Node.Assign:
        code = `${node.lhs} = ${node.rhs};`
        break
      case Node.Label:
        code = `${node.label}:`
        break
      case Node.Break:
        code = node.label ? `break ${node.label};` : "break;"
        break
      case Node.Throw:
        code = `throw ${node.error};`
        break
      case Node.AnyCode:
        code = `${node.code};`
        break
      default:
        throw new Error("ajv implementation error")
    }
    this._out += code + this._n
  }

  private _blockCode({nodes, block = true}: TreeNode): void {
    if (block) this._out += "{" + this._n
    nodes.forEach((n) => ("nodes" in n ? this._nodeCode(n) : this._leafNodeCode(n)))
    if (block) this._out += "}" + this._n
  }

  private get _currNode(): TreeNode {
    const ns = this._nodes
    return ns[ns.length - 1]
  }

  private set _currNode(node: TreeNode) {
    const ns = this._nodes
    ns[ns.length - 1] = node
  }
}

function optimizeNodes(nodes: (BlockNode | LeafNode)[]): void {
  let i = 0
  while (i < nodes.length) {
    const n = nodes[i]
    if ("nodes" in n) optimizeNodes(n.nodes)
    switch (n.kind) {
      case Node.If: {
        let ns = optimiseIf(n)
        if (ns === n) break
        ns = Array.isArray(ns) ? ns : ns ? [ns] : []
        nodes.splice(i, 1, ...ns)
        continue
      }
      case Node.For:
        if (n.nodes.length) break
        nodes.splice(i, 1)
        continue
    }
    i++
  }
}

function optimiseIf(node: IfNode): IfNode | (BlockNode | LeafNode)[] | undefined {
  const cond = node.condition
  if (cond === true) return node.nodes // else is ignored here
  optimizeElse(node)
  if (node.else) {
    const e = node.else
    if (cond === false) return e.kind === Node.If ? e : e.nodes
    if (node.nodes.length) return node
    return {
      kind: Node.If,
      condition: _`!(${node.condition})`,
      nodes: e.kind === Node.If ? [e] : e.nodes,
    }
  }
  if (cond === false || !node.nodes.length) return undefined
  return node
}

function optimizeElse(node: IfNode): void {
  if (!node.else) return
  if (node.else.kind === Node.Else) {
    if (node.else.nodes.length === 0) delete node.else
    return
  }
  const nodes = optimiseIf(node.else)
  node.else = Array.isArray(nodes) ? {kind: Node.Else, nodes} : nodes
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
