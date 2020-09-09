import {_, nil, Code, Name} from "./code"

export interface NameRec {
  prefixName: Name
  scopeIndex?: number
  name: Name
  value: NameValue
}

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
  value: NameValue
  constructor({name, value}: NameRec) {
    super(`CodeGen: "code" for ${name} not defined`)
    this.value = value
  }
}

interface ScopeOptions {
  scope?: ScopeStore
  prefixes?: Set<string>
  parent?: Scope
}

export type ScopeStore = Record<string, ValueReference[]>

type ScopeValues = {[prefix: string]: Map<unknown, NameRec>}

export type ScopeValueSets = {[prefix: string]: Set<NameRec>}

export class Scope {
  _names: {[prefix: string]: NameGroup} = {}
  _prefixes?: Set<string>
  _parent?: Scope

  constructor({prefixes, parent}: ScopeOptions = {}) {
    this._prefixes = prefixes
    this._parent = parent
  }

  name(prefix: string): Name {
    let ng = this._names[prefix]
    if (!ng) {
      checkPrefix.call(this, prefix)
      ng = this._names[prefix] = {prefix, index: 0}
    }
    return new Name(ng.prefix + ng.index++)
  }
}

export class ValueScope extends Scope {
  _values: ScopeValues = {}
  _scope?: ScopeStore

  constructor(opts: ScopeOptions = {}) {
    super(opts)
    this._scope = opts.scope
  }

  get() {
    return this._scope
  }

  value(prefix: string, value: NameValue): NameRec {
    const {ref, key, code} = value
    const valueKey = key ?? ref ?? code
    if (!valueKey) throw new Error("CodeGen: ref or code must be passed in value")
    let vs = this._values[prefix]
    if (vs) {
      const rec = vs.get(valueKey)
      if (rec) return rec
    } else {
      vs = this._values[prefix] = new Map()
    }

    const rec: NameRec = {
      prefixName: new Name(prefix),
      name: this.name(prefix),
      value,
    }
    vs.set(valueKey, rec)

    if (this._scope && value.ref) {
      const s = this._scope[prefix] || (this._scope[prefix] = [])
      rec.scopeIndex = s.length
      s[rec.scopeIndex] = value.ref
    }
    return rec
  }

  scopeRefs(scopeName: Name, values?: ScopeValues | ScopeValueSets): Code {
    if (!this._scope) {
      throw new Error("CodeGen: scope has to be passed via options to use scopeRefs")
    }
    return _reduceValues.call(this, values, (rec: NameRec) => {
      const {value, prefixName, scopeIndex} = rec
      if (scopeIndex !== undefined) return _`${scopeName}.${prefixName}[${scopeIndex}]`
      if (value.code) return value.code
      throw new Error("ajv implementation error")
    })
  }

  scopeCode(values?: ScopeValues | ScopeValueSets): Code {
    return _reduceValues.call(this, values, (rec: NameRec) => {
      const c = rec.value.code
      if (c) return c
      throw new ValueError(rec)
    })
  }
}

function checkPrefix(this: Scope, prefix: string) {
  if (this._parent?._prefixes?.has(prefix) || (this._prefixes && !this._prefixes?.has(prefix))) {
    throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`)
  }
}

function _reduceValues(
  this: ValueScope,
  values: ScopeValues | ScopeValueSets = this._values,
  valueCode: (n: NameRec) => Code
): Code {
  let code: Code = nil
  for (const prefix in values) {
    values[prefix].forEach((rec: NameRec) => {
      code = _`${code}const ${rec.name} = ${valueCode(rec)};`
    })
  }
  return code
}
