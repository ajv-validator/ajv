import type {AnySchema, AnySchemaObject} from "../types"
import type Ajv from "../ajv"
import {eachItem} from "./util"
import equal from "fast-deep-equal"
import traverse from "json-schema-traverse"
import URI = require("uri-js")

// the hash of local references inside the schema (created by getSchemaRefs), used for inline resolution
export interface LocalRefs {
  [ref: string]: AnySchemaObject | undefined
}

// TODO refactor to use keyword definitions
const SIMPLE_INLINED = new Set([
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

export function inlineRef(schema: AnySchema, limit: boolean | number = true): boolean {
  if (typeof schema == "boolean") return true
  if (limit === true) return !hasRef(schema)
  if (!limit) return false
  return countKeys(schema) <= limit
}

function hasRef(schema: AnySchemaObject): boolean {
  for (const key in schema) {
    if (key === "$ref") return true
    const sch = schema[key]
    if (Array.isArray(sch) && sch.some(hasRef)) return true
    if (typeof sch == "object" && hasRef(sch)) return true
  }
  return false
}

function countKeys(schema: AnySchemaObject): number {
  let count = 0
  for (const key in schema) {
    if (key === "$ref") return Infinity
    count++
    if (SIMPLE_INLINED.has(key)) continue
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

export function resolveUrl(baseId: string, id: string): string {
  id = normalizeId(id)
  return URI.resolve(baseId, id)
}

const ANCHOR = /^[a-z_][-a-z0-9._]*$/i

export function getSchemaRefs(this: Ajv, schema: AnySchema): LocalRefs {
  if (typeof schema == "boolean") return {}
  const schemaId = normalizeId(schema.$id)
  const baseIds: {[jsonPtr: string]: string} = {"": schemaId}
  const pathPrefix = getFullPath(schemaId, false)
  const localRefs: LocalRefs = {}

  traverse(schema, {allKeys: true}, (sch, jsonPtr, _, parentJsonPtr) => {
    if (parentJsonPtr === undefined) return
    const fullPath = pathPrefix + jsonPtr
    let baseId = baseIds[parentJsonPtr]
    if (typeof sch.$id == "string") baseId = addRef.call(this, sch.$id)
    addAnchor.call(this, sch.$anchor)
    addAnchor.call(this, sch.$dynamicAnchor)
    baseIds[jsonPtr] = baseId

    function addRef(this: Ajv, ref: string): string {
      ref = normalizeId(baseId ? URI.resolve(baseId, ref) : ref)
      let schOrRef = this.refs[ref]
      if (typeof schOrRef == "string") schOrRef = this.refs[schOrRef]
      if (typeof schOrRef == "object") {
        checkAmbiguosId(sch, schOrRef.schema, ref)
      } else if (ref !== normalizeId(fullPath)) {
        if (ref[0] === "#") {
          checkAmbiguosId(sch, localRefs[ref], ref)
          localRefs[ref] = sch
        } else {
          this.refs[ref] = fullPath
        }
      }
      return ref
    }

    function addAnchor(this: Ajv, anchor: unknown): void {
      if (typeof anchor == "string") {
        if (!ANCHOR.test(anchor)) throw new Error(`invalid anchor "${anchor}"`)
        addRef.call(this, `#${anchor}`)
      }
    }
  })

  return localRefs

  function checkAmbiguosId(sch1: AnySchema, sch2: AnySchema | undefined, id: string): void {
    if (sch2 !== undefined && !equal(sch1, sch2)) {
      throw new Error(`id "${id}" resolves to more than one schema`)
    }
  }
}
