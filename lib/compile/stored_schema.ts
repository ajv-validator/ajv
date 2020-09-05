import {Schema, ValidateFunction} from "../types"
import {SchemaRoot} from "./index"
import {LocalRefs} from "./resolve"

export interface _StoredSchema {
  schema: Schema
  id?: string
  ref?: string
  cacheKey?: unknown
  fragment?: true
  meta?: boolean
  root?: ValidateFunction | SchemaRoot
  refs?: {[ref: string]: number}
  refVal?: (string | undefined)[]
  localRefs?: LocalRefs
  baseId?: string
  validate?: ValidateFunction
  compiling?: boolean
}

export default class StoredSchema implements _StoredSchema {
  schema: Schema
  id?: string
  ref?: string
  cacheKey?: unknown
  fragment?: true
  meta?: boolean
  root?: ValidateFunction | SchemaRoot
  refs?: {[ref: string]: number}
  refVal?: (string | undefined)[]
  localRefs?: LocalRefs
  baseId?: string
  validate?: ValidateFunction
  compiling?: boolean

  constructor(obj: _StoredSchema) {
    this.schema = obj.schema
    Object.assign(this, obj)
  }
}
