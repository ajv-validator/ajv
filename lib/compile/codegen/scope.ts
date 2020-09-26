import {_, nil, Code, Name} from "./code"

interface NameGroup {
  prefix: string
  index: number
}

export interface NameValue {
  ref: ValueReference // this is the reference to any value that can be referred to from generated code via `globals` var in the closure
  key?: unknown // any key to identify a global to avoid duplicates, if not passed ref is used
  code?: Code // this is the code creating the value needed for standalone code wit_out closure - can be a primitive value, function or import (`require`)
}

export type ValueReference = unknown // possibly make CodeGen parameterized type on this type

class ValueError extends Error {
  readonly value?: NameValue
  constructor(name: ValueScopeName) {
    super(`CodeGen: "code" for ${name} not defined`)
    this.value = name.value
  }
}

interface ScopeOptions {
  prefixes?: Set<string>
  parent?: Scope
}

interface ValueScopeOptions extends ScopeOptions {
  scope: ScopeStore
}

export type ScopeStore = Record<string, ValueReference[] | undefined>

interface ScopeValues {
  [prefix: string]: Map<unknown, ValueScopeName> | undefined
}

export interface ScopeValueSets {
  [prefix: string]: Set<ValueScopeName> | undefined
}

export class Scope {
  protected readonly _names: {[prefix: string]: NameGroup | undefined} = {}
  protected readonly _prefixes?: Set<string>
  protected readonly _parent?: Scope

  constructor({prefixes, parent}: ScopeOptions = {}) {
    this._prefixes = prefixes
    this._parent = parent
  }

  toName(nameOrPrefix: Name | string): Name {
    return nameOrPrefix instanceof Name ? nameOrPrefix : this.name(nameOrPrefix)
  }

  name(prefix: string): Name {
    return new Name(this._newName(prefix))
  }

  protected _newName(prefix: string): string {
    const ng = this._names[prefix] || this._nameGroup(prefix)
    return `${prefix}${ng.index++}`
  }

  private _nameGroup(prefix: string): NameGroup {
    if (this._parent?._prefixes?.has(prefix) || (this._prefixes && !this._prefixes.has(prefix))) {
      throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`)
    }
    return (this._names[prefix] = {prefix, index: 0})
  }
}

interface ScopePath {
  property: string
  itemIndex: number
}

export class ValueScopeName extends Name {
  readonly prefix: string
  value?: NameValue
  scopePath?: Code

  constructor(prefix: string, nameStr: string) {
    super(nameStr)
    this.prefix = prefix
  }

  setValue(value: NameValue, {property, itemIndex}: ScopePath): void {
    this.value = value
    this.scopePath = _`.${new Name(property)}[${itemIndex}]`
  }
}

export class ValueScope extends Scope {
  protected readonly _values: ScopeValues = {}
  protected readonly _scope: ScopeStore

  constructor(opts: ValueScopeOptions) {
    super(opts)
    this._scope = opts.scope
  }

  get(): ScopeStore {
    return this._scope
  }

  name(prefix: string): ValueScopeName {
    return new ValueScopeName(prefix, this._newName(prefix))
  }

  value(nameOrPrefix: ValueScopeName | string, value: NameValue): ValueScopeName {
    if (value.ref === undefined) throw new Error("CodeGen: ref must be passed in value")
    const name = this.toName(nameOrPrefix) as ValueScopeName
    const {prefix} = name
    const valueKey = value.key ?? value.ref
    let vs = this._values[prefix]
    if (vs) {
      const _name = vs.get(valueKey)
      if (_name) return _name
    } else {
      vs = this._values[prefix] = new Map()
    }
    vs.set(valueKey, name)

    const s = this._scope[prefix] || (this._scope[prefix] = [])
    const itemIndex = s.length
    s[itemIndex] = value.ref
    name.setValue(value, {property: prefix, itemIndex})
    return name
  }

  getValue(prefix: string, keyOrRef: unknown): ValueScopeName | undefined {
    const vs = this._values[prefix]
    if (!vs) return
    return vs.get(keyOrRef)
  }

  scopeRefs(scopeName: Name, values: ScopeValues | ScopeValueSets = this._values): Code {
    return this._reduceValues(values, (name: ValueScopeName) => {
      if (name.scopePath === undefined) throw new Error(`CodeGen: name "${name}" has no value`)
      return _`${scopeName}${name.scopePath}`
    })
  }

  scopeCode(values: ScopeValues | ScopeValueSets = this._values): Code {
    return this._reduceValues(values, (name: ValueScopeName) => {
      const c = name.value?.code
      if (c) return c
      throw new ValueError(name)
    })
  }

  private _reduceValues(
    values: ScopeValues | ScopeValueSets,
    valueCode: (n: ValueScopeName) => Code
  ): Code {
    let code: Code = nil
    for (const prefix in values) {
      values[prefix]?.forEach((name: ValueScopeName) => {
        code = _`${code}const ${name} = ${valueCode(name)};`
      })
    }
    return code
  }
}
