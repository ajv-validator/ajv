import {_, nil, Code, Name} from "./code"

interface NameGroup {
  prefix: string
  index: number
}

export interface NameValue {
  ref?: ValueReference // this is the reference to any value that can be referred to from generated code via `globals` var in the closure
  key?: unknown // any key to identify a global to avoid duplicates, if not passed ref is used
  code?: Code // this is the code creating the value needed for standalone code wit_out closure - can be a primitive value, function or import (`require`)
}

export type ValueReference = unknown // possibly make CodeGen parameterized type on this type

class ValueError extends Error {
  value?: NameValue
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

export type ScopeStore = Record<string, ValueReference[]>

type ScopeValues = {[prefix: string]: Map<unknown, ValueScopeName>}

export type ScopeValueSets = {[prefix: string]: Set<ValueScopeName>}

export class Scope {
  _names: {[prefix: string]: NameGroup} = {}
  _prefixes?: Set<string>
  _parent?: Scope

  constructor({prefixes, parent}: ScopeOptions = {}) {
    this._prefixes = prefixes
    this._parent = parent
  }

  name(prefix: string): Name {
    const ng = nameGroup.call(this, prefix)
    return new Name(ng.prefix + ng.index++)
  }
}

export class ValueScopeName extends Name {
  prefixName: Name
  // index: number
  scopeIndex?: number
  value: NameValue

  constructor(prefix: string, index: number, value: NameValue) {
    super(prefix + index)
    this.prefixName = new Name(prefix)
    this.value = value
  }
}

export class ValueScope extends Scope {
  _values: ScopeValues = {}
  _scope: ScopeStore

  constructor(opts: ValueScopeOptions) {
    super(opts)
    this._scope = opts.scope
  }

  get() {
    return this._scope
  }

  value(prefix: string, value: NameValue): ValueScopeName {
    const {ref, key, code} = value
    const valueKey = key ?? ref ?? code
    if (!valueKey) throw new Error("CodeGen: ref or code must be passed in value")
    let vs = this._values[prefix]
    if (vs) {
      const name = vs.get(valueKey)
      if (name) return name
    } else {
      vs = this._values[prefix] = new Map()
    }

    const ng = nameGroup.call(this, prefix)
    const name = new ValueScopeName(prefix, ng.index++, value)

    vs.set(valueKey, name)

    if (value.ref) {
      const s = this._scope[prefix] || (this._scope[prefix] = [])
      name.scopeIndex = s.length
      s[name.scopeIndex] = value.ref
    }
    return name
  }

  scopeRefs(scopeName: Name, values?: ScopeValues | ScopeValueSets): Code {
    return reduceValues.call(this, values, (name: ValueScopeName) => {
      const {value, prefixName, scopeIndex} = name
      if (scopeIndex !== undefined) return _`${scopeName}.${prefixName}[${scopeIndex}]`
      if (value.code) return value.code
      throw new Error("ajv implementation error")
    })
  }

  scopeCode(values?: ScopeValues | ScopeValueSets): Code {
    return reduceValues.call(this, values, (name: ValueScopeName) => {
      const c = name.value.code
      if (c) return c
      throw new ValueError(name)
    })
  }
}

function nameGroup(this: Scope | ValueScope, prefix: string): NameGroup {
  let ng = this._names[prefix]
  if (!ng) {
    if (this._parent?._prefixes?.has(prefix) || (this._prefixes && !this._prefixes?.has(prefix))) {
      throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`)
    }
    ng = this._names[prefix] = {prefix, index: 0}
  }
  return ng
}

function reduceValues(
  this: ValueScope,
  values: ScopeValues | ScopeValueSets = this._values,
  valueCode: (n: ValueScopeName) => Code
): Code {
  let code: Code = nil
  for (const prefix in values) {
    values[prefix].forEach((name: ValueScopeName) => {
      code = _`${code}const ${name} = ${valueCode(name)};`
    })
  }
  return code
}
