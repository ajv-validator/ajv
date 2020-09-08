import {_, nil, Code, Name} from "./code"

interface NameRec {
  name: Name
  value: NameValue
}

interface NameGroup {
  prefix: string
  index: number
  values?: Map<unknown, NameRec> // same key as passed in GlobalValue
}

export interface NameValue {
  ref?: ValueReference // this is the reference to any value that can be referred to from generated code via `globals` var in the closure
  key?: unknown // any key to identify a global to avoid duplicates, if not passed ref is used
  code?: Code // this is the code creating the value needed for standalone code wit_out closure - can be a primitive value, function or import (`require`)
}

export type ValueReference = unknown // possibly make CodeGen parameterized type on this type

class ValueError extends Error {
  value: NameValue
  constructor(fields: string, {name, value}: NameRec) {
    super(`CodeGen: ${fields} for ${name} not defined`)
    this.value = value
  }
}

export interface _Scope {
  [prefix: string]: ValueReference[]
}

export class Scope {
  _names: {[prefix: string]: NameGroup} = {}
  _valuePrefixes: {[prefix: string]: Name} = {}
  _parent?: Scope

  constructor(parent?: Scope) {
    this._parent = parent
  }

  _nameGroup(prefix: string): NameGroup {
    let ng = this._names[prefix]
    if (!ng) ng = this._names[prefix] = {prefix, index: 0}
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
    const {ref, key, code} = value
    const valueKey = key ?? ref ?? code
    if (!valueKey) throw new Error("CodeGen: ref or code must be passed in value")
    const ng = this._nameGroup(prefix)
    this._valuePrefixes[prefix] = new Name(prefix)
    if (!ng.values) {
      ng.values = new Map()
    } else {
      const rec = ng.values.get(valueKey)
      if (rec) return rec.name
    }
    const name = this._name(ng)
    ng.values.set(valueKey, {name, value})
    return name
  }

  scopeRefs(scopeName: Name, scope: _Scope): Code {
    return this._reduceValues((rec: NameRec, prefix: string, i: number) => {
      const {value: v} = rec
      if (v.ref) {
        if (!scope[prefix]) scope[prefix] = []
        scope[prefix][i] = v.ref
        const prefName = this._valuePrefixes[prefix]
        return _`${scopeName}.${prefName}[${i}]`
      }
      if (v.code) return v.code
      throw new ValueError("ref and code", rec)
    })
  }

  scopeCode(): Code {
    return this._reduceValues((rec: NameRec) => {
      const c = rec.value.code
      if (c) return c
      throw new ValueError("code", rec)
    })
  }

  _reduceValues(valueCode: (n: NameRec, pref: string, index: number) => Code): Code {
    let code: Code = nil
    for (const prefix in this._valuePrefixes) {
      let i = 0
      const values = this._names[prefix].values
      if (!values) throw new Error("ajv implementation error")
      values.forEach((rec: NameRec) => {
        code = _`${code}const ${rec.name} = ${valueCode(rec, prefix, i++)};`
      })
    }
    return code
  }
}

// class ParentScope extends Scope {
//   _children: Scope[] = []
//   _childrenPrefixes: {[prefix: string]: Name} = {}

//   _freePrefix(prefix?: string) {

//   }
// }
