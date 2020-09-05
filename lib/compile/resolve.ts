import {Schema, ValidateFunction, SchemaObject} from "../types"
import {SchemaEnv, SchemaRoot} from "./index"
import StoredSchema from "./stored_schema"
import {eachItem, toHash, schemaHasRulesExcept, unescapeFragment} from "./util"
import Ajv from "../ajv"
import equal from "fast-deep-equal"
import traverse = require("json-schema-traverse")
import URI = require("uri-js")

export interface LocalRefs {
  [ref: string]: SchemaObject
}

// resolve and compile the references ($ref)
// TODO returns SchemaObject (if the schema can be inlined) or validation function
export function resolve(
  this: Ajv,
  localCompile: (
    _schema: Schema,
    _root: SchemaRoot,
    localRefs?: LocalRefs,
    baseId?: string
  ) => ValidateFunction, // reference to schema compilation function (localCompile)
  root: SchemaRoot, // information about the root schema for the current schema
  ref: string // reference to resolve
): Schema | ValidateFunction | undefined {
  let schOrRef = this._refs[ref]
  if (typeof schOrRef == "string") {
    if (this._refs[schOrRef]) schOrRef = this._refs[schOrRef]
    else return resolve.call(this, localCompile, root, schOrRef)
  }

  schOrRef = schOrRef || this._schemas[ref]
  if (schOrRef instanceof StoredSchema) {
    return inlineRef(schOrRef.schema, this._opts.inlineRefs)
      ? schOrRef.schema
      : schOrRef.validate || this._compile(schOrRef)
  }

  var env = resolveSchema.call(this, root, ref)
  var schema, baseId
  if (env) {
    schema = env.schema
    root = env.root
    baseId = env.baseId
  }

  if (schema instanceof StoredSchema) {
    if (!schema.validate) {
      schema.validate = localCompile.call(this, schema.schema, root, undefined, baseId)
    }
    return schema.validate
  }
  if (schema !== undefined) {
    return inlineRef(schema, this._opts.inlineRefs)
      ? schema
      : localCompile.call(this, schema, root, undefined, baseId)
  }
}

// Resolve schema, its root and baseId
export function resolveSchema(
  this: Ajv,
  root: SchemaRoot, // root object with properties schema, refVal, refs TODO below StoredSchema is assigned to it
  ref: string // reference to resolve
): SchemaEnv | undefined {
  const p = URI.parse(ref)
  const refPath = _getFullPath(p)
  let baseId = getFullPath(root.schema.$id)
  if (Object.keys(root.schema).length === 0 || refPath !== baseId) {
    var id = normalizeId(refPath)
    var refVal = this._refs[id]
    if (typeof refVal == "string") {
      return resolveRecursive.call(this, root, refVal, p)
    }
    if (refVal instanceof StoredSchema) {
      if (!refVal.validate) this._compile(refVal)
      root = <SchemaRoot>refVal
    } else {
      refVal = this._schemas[id]
      if (refVal instanceof StoredSchema) {
        if (!refVal.validate) this._compile(refVal)
        if (id === normalizeId(ref)) {
          return {schema: refVal, root, baseId}
        }
        root = <SchemaRoot>refVal
      } else {
        return
      }
    }
    if (!root.schema) return
    baseId = getFullPath(root.schema.$id)
  }
  return getJsonPointer.call(this, p, {schema: root.schema, root, baseId})
}

function resolveRecursive(
  this: Ajv,
  root: SchemaRoot,
  ref: string,
  parsedRef: URI.URIComponents
): SchemaEnv | undefined {
  const env = resolveSchema.call(this, root, ref)
  if (!env) return
  const {schema, baseId} = env
  if (typeof schema == "object" && schema.$id) {
    env.baseId = resolveUrl(baseId, schema.$id)
  }
  return getJsonPointer.call(this, parsedRef, env)
}

var PREVENT_SCOPE_CHANGE = toHash([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions",
])

function getJsonPointer(
  this: Ajv,
  parsedRef: URI.URIComponents,
  {baseId, schema, root}: SchemaEnv
): SchemaEnv | undefined {
  if (typeof schema == "boolean") return
  parsedRef.fragment = parsedRef.fragment || ""
  if (parsedRef.fragment.slice(0, 1) !== "/") return
  const parts = parsedRef.fragment.split("/")

  for (let part of parts) {
    if (!part) continue
    part = unescapeFragment(part)
    schema = schema[part]
    if (schema === undefined) return
    if (PREVENT_SCOPE_CHANGE[part]) continue
    if (typeof schema == "object" && schema.$id) {
      baseId = resolveUrl(baseId, schema.$id)
    }
  }
  if (schema === undefined) return
  if (
    typeof schema != "boolean" &&
    schema.$ref &&
    !schemaHasRulesExcept(schema, this.RULES.all, "$ref")
  ) {
    const $ref = resolveUrl(baseId, schema.$ref)
    const _env = resolveSchema.call(this, root, $ref)
    if (_env && !isRootEnv(_env)) return _env
  }
  const env = {schema, root, baseId}
  if (!isRootEnv(env)) return env
}

function isRootEnv({schema, root}: SchemaEnv): boolean {
  return schema === root.schema
}

// TODO refactor to use keyword definitions
var SIMPLE_INLINED = toHash([
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
  var p = URI.parse(id)
  return _getFullPath(p)
}

function _getFullPath(p: URI.URIComponents): string {
  return URI.serialize(p).split("#")[0] + "#"
}

var TRAILING_SLASH_HASH = /#\/?$/
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
