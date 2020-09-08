import {Schema, SchemaObject} from "../types"
import {eachItem, toHash} from "./util"
import Ajv from "../ajv"
import equal from "fast-deep-equal"
import traverse = require("json-schema-traverse")
import URI = require("uri-js")

// the hash of local references inside the schema (created by getSchemaRefs), used for inline resolution
export interface LocalRefs {
  [ref: string]: SchemaObject
}

// TODO refactor to use keyword definitions
const SIMPLE_INLINED = toHash([
  "type",
  "format",
  "pattern",
  "maxLength",
  "minLength",
  "maxProperties",
  "minProperties",
  "maxItems",
  "minItems",
  "maximum",
  "minimum",
  "uniqueItems",
  "multipleOf",
  "required",
  "enum",
  "const",
])
export function inlineRef(schema: Schema, limit: boolean | number = true): boolean {
  if (typeof schema == "boolean") return true
  if (limit === true) return !hasRef(schema)
  if (!limit) return false
  return countKeys(schema) <= limit
}

function hasRef(schema: SchemaObject): boolean {
  for (const key in schema) {
    if (key === "$ref") return true
    const sch = schema[key]
    if (Array.isArray(sch) && sch.some(hasRef)) return true
    if (typeof sch == "object" && hasRef(sch)) return true
  }
  return false
}

function countKeys(schema: SchemaObject): number {
  let count = 0
  for (const key in schema) {
    if (key === "$ref") return Infinity
    count++
    if (SIMPLE_INLINED[key]) continue
    if (typeof schema[key] == "object") {
      eachItem(schema[key], (sch) => (count += countKeys(sch)))
    }
    if (count === Infinity) return Infinity
  }
  return count
}

export function getFullPath(id = "", normalize?: boolean): string {
  if (normalize !== false) id = normalizeId(id)
  const p = URI.parse(id)
  return _getFullPath(p)
}

export function _getFullPath(p: URI.URIComponents): string {
  return URI.serialize(p).split("#")[0] + "#"
}

const TRAILING_SLASH_HASH = /#\/?$/
export function normalizeId(id: string | undefined): string {
  return id ? id.replace(TRAILING_SLASH_HASH, "") : ""
}

export function resolveUrl(baseId = "", id: string): string {
  id = normalizeId(id)
  return URI.resolve(baseId, id)
}

export function getSchemaRefs(this: Ajv, schema: Schema): LocalRefs {
  if (typeof schema == "boolean") return {}
  const schemaId = normalizeId(schema.$id)
  const baseIds: {[jsonPtr: string]: string} = {"": schemaId}
  const pathPrefix = getFullPath(schemaId, false)
  const localRefs: LocalRefs = {}
  const self = this

  traverse(schema, {allKeys: true}, (sch, jsonPtr, _, parentJsonPtr) => {
    if (parentJsonPtr === undefined) return
    const fullPath = pathPrefix + jsonPtr
    let id = sch.$id
    let baseId = baseIds[parentJsonPtr]
    if (typeof id == "string") {
      id = baseId = normalizeId(baseId ? URI.resolve(baseId, id) : id)
      let schOrRef = self._refs[id]
      if (typeof schOrRef == "string") schOrRef = self._refs[schOrRef]
      if (typeof schOrRef == "object" && schOrRef.schema) {
        checkAmbiguosId(sch, schOrRef.schema, id)
      } else if (id !== normalizeId(fullPath)) {
        if (id[0] === "#") {
          if (localRefs[id]) checkAmbiguosId(sch, localRefs[id], id)
          localRefs[id] = sch
        } else {
          self._refs[id] = fullPath
        }
      }
    }
    baseIds[jsonPtr] = baseId
  })

  return localRefs

  function checkAmbiguosId(sch1: Schema, sch2: Schema, id: string) {
    if (!equal(sch1, sch2)) throw new Error(`id "${id}" resolves to more than one schema`)
  }
}
