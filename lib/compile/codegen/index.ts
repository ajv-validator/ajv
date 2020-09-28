import type {ScopeValueSets, NameValue, ValueScope, ValueScopeName} from "./scope"
import {_, nil, _Code, Code, Name, UsedNames, CodeItem, addCodeArg, _CodeOrName} from "./code"
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
}

abstract class _Node {
  abstract readonly names: UsedNames

  optimizeNodes(): this | ChildNode | ChildNode[] | undefined {
    return this
  }

  optimizeNames(_names: UsedNames): this | undefined {
    return this
  }

  // get count(): number {
  //   return 1
  // }
}

class Def extends _Node {
  constructor(public varKind: Name, public name: Name, public rhs?: SafeExpr) {
    super()
  }

  get names(): UsedNames {
    return this.rhs instanceof _CodeOrName ? this.rhs.names : {}
  }

  render({es5, lines}: CodeGenOptions): string {
    const varKind = es5 ? varKinds.var : this.varKind
    let code = `${varKind} ${this.name}`
    if (this.rhs !== undefined) code += ` = ${this.rhs}`
    return code + (lines ? ";\n" : ";")
  }

  optimizeNames(names: UsedNames): this | undefined {
    return names[this.name.str] ? this : undefined
  }
}

class Assign extends _Node {
  constructor(public lhs: Code, public rhs: SafeExpr) {
    super()
  }

  get names(): UsedNames {
    const names = this.lhs instanceof Name ? {} : {...this.lhs.names}
    return this.rhs instanceof _CodeOrName ? addNames(names, this.rhs.names) : names
  }

  render({lines}: CodeGenOptions): string {
    return `${this.lhs} = ${this.rhs};` + (lines ? "\n" : "")
  }

  optimizeNames(names: UsedNames): this | undefined {
    if (this.lhs instanceof Name && !names[this.lhs.str]) return
    return this
  }
}

class Label extends _Node {
  readonly names: UsedNames = {}
  constructor(public label: Name) {
    super()
  }

  render({lines}: CodeGenOptions): string {
    return `${this.label}:` + (lines ? "\n" : "")
  }
}

class Break extends _Node {
  readonly names: UsedNames = {}
  constructor(public label?: Code) {
    super()
  }

  render({lines}: CodeGenOptions): string {
    let code = "break"
    if (this.label) code += ` ${this.label}`
    return code + (lines ? ";\n" : ";")
  }
}

class Throw extends _Node {
  constructor(public error: Code) {
    super()
  }

  get names(): UsedNames {
    return this.error.names
  }

  render({lines}: CodeGenOptions): string {
    return `throw ${this.error};` + (lines ? "\n" : "")
  }
}

class AnyCode extends _Node {
  constructor(public code: SafeExpr) {
    super()
  }

  get names(): UsedNames {
    return this.code instanceof _CodeOrName ? this.code.names : {}
  }

  render({lines}: CodeGenOptions): string {
    return `${this.code};` + (lines ? "\n" : "")
  }

  optimizeNodes(): this | undefined {
    return `${this.code}` ? this : undefined
  }
}

abstract class _ParentNode extends _Node {
  readonly nodes: ChildNode[]
  readonly block: boolean = true

  constructor(nodes?: ChildNode[]) {
    super()
    this.nodes = nodes || []
  }

  get names(): UsedNames {
    return this.nodes.reduce((names: UsedNames, n) => addNames(names, n.names), {})
  }

  render(opts: CodeGenOptions): string {
    const eol = opts.lines ? "\n" : ""
    let code = ""
    if (this.block) code += "{" + eol
    this.nodes.forEach((n) => (code += n.render(opts)))
    if (this.block) code += "}" + eol
    return code
  }

  optimizeNodes(): this | ChildNode | ChildNode[] | undefined {
    const {nodes} = this
    let i = 0
    while (i < nodes.length) {
      const n = nodes[i].optimizeNodes()
      if (Array.isArray(n)) nodes.splice(i, 1, ...n)
      else if (n) nodes[i++] = n
      else nodes.splice(i, 1)
    }
    return this.nodes.length > 0 ? this : undefined
  }

  optimizeNames(names: UsedNames): this | undefined {
    let i = 0
    while (i < this.nodes.length) {
      const n = this.nodes[i]
      if (n.optimizeNames(names)) {
        i++
      } else {
        subtractNames(names, n.names)
        this.nodes.splice(i, 1)
      }
    }
    return this.nodes.length > 0 ? this : undefined
  }

  // get count(): number {
  //   return 1 + this.nodes.reduce((c, n) => c + n.count, 0)
  // }
}

class Root extends _ParentNode {
  readonly block = false

  optimizeNames(): this {
    super.optimizeNames(this.names)
    return this
  }
}

class Else extends _ParentNode {
  static readonly kind = "else"
}

class If extends _ParentNode {
  static readonly kind = "if"
  else?: If | Else
  constructor(public condition: Code | boolean, nodes?: ChildNode[]) {
    super(nodes)
  }

  render(opts: CodeGenOptions): string {
    let code = `if(${this.condition})` + super.render(opts)
    if (this.else) code += "else " + this.else.render(opts)
    return code
  }

  optimizeNodes(): If | ChildNode[] | undefined {
    super.optimizeNodes()
    const cond = this.condition
    if (cond === true) return this.nodes // else is ignored here
    let e = this.else
    if (e) {
      const ns = e.optimizeNodes()
      e = this.else = Array.isArray(ns) ? new Else(ns) : (ns as Else | undefined)
    }
    if (e) {
      if (cond === false) return e instanceof If ? e : e.nodes
      if (this.nodes.length) return this
      return new If(not(cond), e instanceof If ? [e] : e.nodes)
    }
    if (cond === false || !this.nodes.length) return undefined
    return this
  }

  optimizeNames(names: UsedNames): this | undefined {
    this.else = this.else?.optimizeNames(names)
    return super.optimizeNames(names) || this.else ? this : undefined
  }

  get names(): UsedNames {
    const names = super.names
    if (this.condition instanceof _CodeOrName) addNames(names, this.condition.names)
    if (this.else) addNames(names, this.else.names)
    return names
  }

  // get count(): number {
  //   return super.count + (this.else?.count || 0)
  // }
}

class For extends _ParentNode {
  static readonly kind = "for"
  constructor(public iteration: Code) {
    super()
  }

  get names(): UsedNames {
    return addNames(super.names, this.iteration.names)
  }

  render(opts: CodeGenOptions): string {
    return `for(${this.iteration})` + super.render(opts)
  }
}

class Func extends _ParentNode {
  static readonly kind = "func"
  constructor(public name: Name, public args: Code, public async?: boolean) {
    super()
  }

  render(opts: CodeGenOptions): string {
    return (this.async ? "async " : "") + `function ${this.name}(${this.args})` + super.render(opts)
  }
}

class Return extends _ParentNode {
  static readonly kind = "return"
  readonly block = false

  render(opts: CodeGenOptions): string {
    return "return " + super.render(opts)
  }
}

class Try extends _ParentNode {
  catch?: Catch
  finally?: Finally

  render(opts: CodeGenOptions): string {
    let code = "try" + super.render(opts)
    if (this.catch) code += this.catch.render(opts)
    if (this.finally) code += this.finally.render(opts)
    return code
  }

  optimizeNodes(): this {
    super.optimizeNodes()
    this.catch?.optimizeNodes() as Catch | undefined
    this.finally?.optimizeNodes() as Finally | undefined
    return this
  }

  optimizeNames(names: UsedNames): this {
    super.optimizeNames(names)
    this.catch?.optimizeNames(names)
    this.finally?.optimizeNames(names)
    return this
  }

  get names(): UsedNames {
    const names = super.names
    if (this.catch) addNames(names, this.catch.names)
    if (this.finally) addNames(names, this.finally.names)
    return names
  }

  // get count(): number {
  //   return super.count + (this.catch?.count || 0) + (this.finally?.count || 0)
  // }
}

class Catch extends _ParentNode {
  static readonly kind = "catch"
  constructor(readonly error: Name) {
    super()
  }

  render(opts: CodeGenOptions): string {
    return `catch(${this.error})` + super.render(opts)
  }
}

class Finally extends _ParentNode {
  static readonly kind = "finally"
  render(opts: CodeGenOptions): string {
    return "finally" + super.render(opts)
  }
}

type BlockNode = If | For | Func | Return | Try

type LeafNode = Def | Assign | Label | Break | Throw | AnyCode

type ParentNode = Root | BlockNode | Else | Catch | Finally

type ChildNode = BlockNode | LeafNode

type BlockNodeType =
  | typeof If
  | typeof Else
  | typeof For
  | typeof Func
  | typeof Return
  | typeof Catch
  | typeof Finally

export class CodeGen {
  readonly _scope: Scope
  readonly _extScope: ValueScope
  readonly _values: ScopeValueSets = {}
  private readonly _nodes: ParentNode[]
  private readonly _blockStarts: number[] = []
  private readonly opts: CodeGenOptions

  // get nodeCount(): number {
  //   return this._root.count
  // }

  constructor(extScope: ValueScope, opts: CodeGenOptions = {}) {
    this.opts = opts
    this._extScope = extScope
    this._scope = new Scope({parent: extScope})
    this._nodes = [new Root()]
  }

  private get _root(): Root {
    return this._nodes[0] as Root
  }

  toString(): string {
    return this._root.render(this.opts)
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

  getScopeValue(prefix: string, keyOrRef: unknown): ValueScopeName | undefined {
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
    this._leafNode(new Def(varKind, name, rhs))
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
    return this._leafNode(new Assign(lhs, rhs))
  }

  // appends passed SafeExpr to code or executes Block
  code(c: Block | SafeExpr): CodeGen {
    if (typeof c == "function") c()
    else if (c !== nil) this._leafNode(new AnyCode(c))
    return this
  }

  // returns code for object literal for the passed argument list of key-value pairs
  object(...keyValues: [Name, SafeExpr | string][]): _Code {
    const code: CodeItem[] = ["{"]
    for (const [key, value] of keyValues) {
      if (code.length > 1) code.push(",")
      code.push(key)
      if (key !== value || this.opts.es5) {
        code.push(":")
        addCodeArg(code, value)
      }
    }
    code.push("}")
    return new _Code(code)
  }

  // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
  if(condition: Code | boolean, thenBody?: Block, elseBody?: Block): CodeGen {
    this._blockNode(new If(condition))

    if (thenBody && elseBody) {
      this.code(thenBody).else().code(elseBody).endIf()
    } else if (thenBody) {
      this.code(thenBody).endIf()
    } else if (elseBody) {
      throw new Error('CodeGen: "else" body without "then" body')
    }
    return this
  }

  // `else if` clause - invalid without `if` or after `else` clauses
  elseIf(condition: Code | boolean): CodeGen {
    return this._elseNode(new If(condition))
  }

  // `else` clause - only valid after `if` or `else if` clauses
  else(): CodeGen {
    return this._elseNode(new Else())
  }

  // end `if` statement (needed if gen.if was used only with condition)
  endIf(): CodeGen {
    return this._endBlockNode(If, Else)
  }

  // a generic `for` clause (or statement if `forBody` is passed)
  for(iteration: Code, forBody?: Block): CodeGen {
    this._blockNode(new For(iteration))
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
      return this.forRange("_i", 0, _`${arr}.length`, (i) => {
        this.var(name, _`${arr}[${i}]`)
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
      return this.forOf(nameOrPrefix, _`Object.keys(${obj})`, forBody)
    }
    const name = this._scope.toName(nameOrPrefix)
    return this.for(_`${varKind} ${name} in ${obj}`, () => forBody(name))
  }

  // end `for` loop
  endFor(): CodeGen {
    return this._endBlockNode(For)
  }

  // `label` statement
  label(label: Name): CodeGen {
    return this._leafNode(new Label(label))
  }

  // `break` statement
  break(label?: Code): CodeGen {
    return this._leafNode(new Break(label))
  }

  // `return` statement
  return(value: Block | SafeExpr): CodeGen {
    const node = new Return()
    this._blockNode(node)
    this.code(value)
    if (node.nodes.length !== 1) throw new Error('CodeGen: "return" should have one node')
    return this._endBlockNode(Return)
  }

  // `try` statement
  try(tryBody: Block, catchCode?: (e: Name) => void, finallyCode?: Block): CodeGen {
    if (!catchCode && !finallyCode) throw new Error('CodeGen: "try" without "catch" and "finally"')
    const node = new Try()
    this._blockNode(node)
    this.code(tryBody)
    if (catchCode) {
      const error = this.name("e")
      this._currNode = node.catch = new Catch(error)
      catchCode(error)
    }
    if (finallyCode) {
      this._currNode = node.finally = new Finally()
      this.code(finallyCode)
    }
    return this._endBlockNode(Catch, Finally)
  }

  // `throw` statement
  throw(error: Code): CodeGen {
    return this._leafNode(new Throw(error))
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
      throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`)
    }
    this._nodes.length = len
    return this
  }

  // `function` heading (or definition if funcBody is passed)
  func(name: Name, args: Code = nil, async?: boolean, funcBody?: Block): CodeGen {
    this._blockNode(new Func(name, args, async))
    if (funcBody) this.code(funcBody).endFunc()
    return this
  }

  // end function definition
  endFunc(): CodeGen {
    return this._endBlockNode(Func)
  }

  optimize(n = 1): void {
    while (n--) {
      this._root.optimizeNodes()
      this._root.optimizeNames()
    }
  }

  private _leafNode(node: LeafNode): CodeGen {
    this._currNode.nodes.push(node)
    return this
  }

  private _blockNode(node: BlockNode): void {
    this._currNode.nodes.push(node)
    this._nodes.push(node)
  }

  private _endBlockNode(N1: BlockNodeType, N2?: BlockNodeType): CodeGen {
    const n = this._currNode
    if (!(n instanceof N1 || (N2 && n instanceof N2))) {
      throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`)
    }
    this._nodes.pop()
    return this
  }

  private _elseNode(node: If | Else): CodeGen {
    const n = this._currNode
    if (!(n instanceof If)) {
      throw new Error('CodeGen: "else" without "if"')
    }
    this._currNode = n.else = node
    return this
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

function addNames(to: UsedNames, from: UsedNames): UsedNames {
  for (const n in from) to[n] = (to[n] || 0) + (from[n] || 0)
  return to
}

function subtractNames(names: UsedNames, from: UsedNames): void {
  for (const n in from) names[n] = (names[n] || 0) - (from[n] || 0)
}

export function not<T extends Code | boolean>(x: T): T
export function not(x: Code | boolean): Code | boolean {
  return typeof x == "boolean" ? !x : _`!${par(x)}`
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
  return (x, y) => (x === nil ? y : y === nil ? x : _`${par(x)} ${op} ${par(y)}`)
}

function par(x: Code): Code {
  return x instanceof Name ? x : _`(${x})`
}
