import {Schema, ValidateFunction} from "../types"
import {SchemaRoot} from "./index"

export interface _StoredSchema {
  id?: string
  ref?: string
  cacheKey?: unknown
  schema?: Schema
  fragment?: true
  meta?: boolean
  root?: SchemaRoot
  refs?: {[ref: string]: number}
  refVal?: unknown[]
  localRefs?: unknown
  baseId?: string
  validate?: ValidateFunction
  compiling?: boolean
}

export default class StoredSchema implements _StoredSchema {
  id?: string
  ref?: string
  cacheKey?: unknown
  schema?: Schema
  fragment?: true
  meta?: boolean
  root?: SchemaRoot
  refs?: {[ref: string]: number}
  refVal?: unknown[]
  localRefs?: unknown
  baseId?: string
  validate?: ValidateFunction
  compiling?: boolean

  constructor(obj: _StoredSchema) {
    Object.assign(this, obj)
  }
}
