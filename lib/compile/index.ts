import type {Schema, SchemaObject, ValidateFunction, ValidateWrapper} from "../types"
import type Ajv from "../ajv"
import {CodeGen, _, nil, str, Code} from "./codegen"
import {ValidationError} from "./error_classes"
import N from "./names"
import {LocalRefs, getFullPath, _getFullPath, inlineRef, normalizeId, resolveUrl} from "./resolve"
import {toHash, schemaHasRulesButRef, unescapeFragment} from "./util"
import {validateFunctionCode} from "./validate"
import URI = require("uri-js")

/**
 * Functions below are used inside compiled validations function
 */

interface _StoredSchema extends Compilation {
  schema: Schema
  id?: string
  ref?: string
  cacheKey?: unknown
  fragment?: true
  meta?: boolean
  root?: SchemaRoot
  refs?: {[ref: string]: number | undefined}
  refVal?: (RefVal | undefined)[]
  localRefs?: LocalRefs
  baseId?: string
  validate?: ValidateFunction
  callValidate?: ValidateWrapper
  compiling?: boolean
}

export class StoredSchema implements _StoredSchema {
  schema: Schema
  id?: string
  ref?: string
  cacheKey?: unknown
  fragment?: true
  meta?: boolean
  root?: SchemaRoot
  refs?: {[ref: string]: number | undefined}
  refVal?: (RefVal | undefined)[]
  localRefs?: LocalRefs
  baseId?: string
  validate?: ValidateFunction
  callValidate?: ValidateWrapper
  compiling?: boolean

  constructor(obj: _StoredSchema) {
    this.schema = obj.schema
    Object.assign(this, obj)
  }
}

export type ResolvedRef = InlineResolvedRef | FuncResolvedRef

export interface InlineResolvedRef {
  code: Code
  schema: Schema
  inline: true
}

interface FuncResolvedRef {
  code: Code
  $async?: boolean
  inline?: false
}

// reference to compiled schema or schema to be inlined
export type RefVal = Schema | ValidateFunction

export interface SchemaRoot {
  schema: SchemaObject
  refVal: (RefVal | undefined)[]
  refs: {[ref: string]: number | undefined}
}

export interface CompileEnv {
  schema: Schema
  root?: SchemaRoot
  localRefs?: LocalRefs
  baseId?: string
}

export interface SchemaEnv extends CompileEnv {
  root: SchemaRoot
}

export interface Compilation extends CompileEnv {
  validate?: ValidateFunction
  callValidate?: ValidateWrapper
}

export function compileStoredSchema(
  this: Ajv,
  schemaObj: StoredSchema
): ValidateFunction | ValidateWrapper {
  if (schemaObj.compiling) return validateWrapper(schemaObj)
  const v = _tryCompile.call(this, schemaObj)
  schemaObj.validate = v
  schemaObj.refs = v.refs
  schemaObj.refVal = v.refVal
  schemaObj.root = v.root
  return v
}

function _tryCompile(this: Ajv, schemaObj: StoredSchema): ValidateFunction | ValidateWrapper {
  const currentOpts = this._opts
  const {meta, schema, localRefs} = schemaObj
  if (meta) this._opts = this._metaOpts

  try {
    schemaObj.compiling = true
    const v = compileSchema.call(this, {schema, localRefs})
    extendValidateWrapper(v, schemaObj, this._opts.sourceCode)
    return v
  } catch (e) {
    delete schemaObj.validate
    delete schemaObj.callValidate
    throw e
  } finally {
    schemaObj.compiling = false
    if (meta) this._opts = currentOpts
  }
}

function validateWrapper(c: Compilation): ValidateWrapper {
  if (!c.callValidate) {
    const wrapper: ValidateWrapper = function (this: Ajv | unknown, ...args) {
      if (wrapper.validate === undefined) throw new Error("ajv implementation error")
      const v = wrapper.validate
      const valid = v.apply(this, args)
      wrapper.errors = v.errors
      return valid
    }
    c.callValidate = wrapper
  }
  c.validate = c.callValidate
  return c.callValidate
}

function extendValidateWrapper(v: ValidateFunction, c: Compilation, sourceCode?: boolean): void {
  const cv = c.callValidate
  if (cv) {
    cv.validate = v
    cv.schema = v.schema
    cv.errors = null
    cv.refs = v.refs
    cv.refVal = v.refVal
    cv.root = v.root
    cv.$async = v.$async
    if (sourceCode) cv.source = v.source
  }
}

// Compiles schema to validation function
function compileSchema(this: Ajv, env: CompileEnv): ValidateFunction | ValidateWrapper {
  const {schema, root: passedRoot, localRefs} = env
  const self = this
  const opts = this._opts
  const refVal: (RefVal | undefined)[] = [undefined]
  const refs: {[ref: string]: number | undefined} = {}
  const root: SchemaRoot = passedRoot || {
    schema: typeof schema == "boolean" ? {} : schema,
    refVal,
    refs,
  }

  let compilation = getCompilation.call(this, env)
  if (compilation) return validateWrapper(compilation)

  compilation = env

  const formats = this._formats

  try {
    this._compilations.add(compilation)
    const v = localCompile({...env, root})
    extendValidateWrapper(v, compilation)
    return v
  } finally {
    this._compilations.delete(compilation)
  }

  function localCompile(_env: SchemaEnv): ValidateFunction {
    const {schema: _schema, root: _root, baseId} = _env
    const isRoot = isRootEnv(_env)
    if (_root !== root) {
      return compileSchema.call(self, _env)
    }

    const $async = typeof _schema == "object" && _schema.$async === true
    const rootId = getFullPath(_root.schema.$id)

    const gen = new CodeGen(self._scope, {...opts.codegen, forInOwn: opts.ownProperties})
    let _ValidationError
    if ($async) {
      _ValidationError = gen.scopeValue("Error", {
        ref: ValidationError,
        code: _`require("ajv/dist/compile/error_classes").ValidationError`,
      })
    }

    validateFunctionCode({
      gen,
      allErrors: !!opts.allErrors,
      data: N.data,
      parentData: N.parentData,
      parentDataProperty: N.parentDataProperty,
      dataNames: [N.data],
      dataPathArr: [nil],
      dataLevel: 0,
      topSchemaRef: _`${N.validate}.schema`,
      async: $async,
      ValidationError: _ValidationError,
      schema: _schema,
      isRoot,
      root: _root,
      rootId,
      baseId: baseId || rootId,
      schemaPath: nil,
      errSchemaPath: "#",
      errorPath: str``,
      RULES: self.RULES, // TODO refactor - it is available on the instance
      formats,
      opts,
      resolveRef, // TODO move to gen.globals
      logger: self.logger,
      self,
    })

    let sourceCode = `${vars(refVal, refValCode)}
                      ${gen.scopeRefs(N.scope)}
                      ${gen.toString()}`

    if (opts.processCode) sourceCode = opts.processCode(sourceCode, _schema)
    // console.log("\n\n\n *** \n", sourceCode)
    let validate: ValidateFunction
    try {
      // TODO refactor to fewer variables - maybe only self and scope
      const makeValidate = new Function(
        N.self.toString(),
        "formats",
        "root",
        "refVal",
        N.scope.toString(),
        sourceCode
      )
      validate = makeValidate(self, formats, root, refVal, self._scope.get())

      refVal[0] = validate
    } catch (e) {
      self.logger.error("Error compiling schema, function code:", sourceCode)
      throw e
    }

    validate.schema = _schema
    validate.errors = null
    validate.refs = refs
    validate.refVal = refVal
    validate.root = isRoot ? root : _root
    if ($async) validate.$async = true
    if (opts.sourceCode === true) {
      validate.source = {
        code: sourceCode,
        scope: self._scope,
      }
    }

    return validate
  }

  function resolveRef(_baseId: string, ref: string, isRoot: boolean): ResolvedRef | void {
    ref = resolveUrl(_baseId, ref)
    const res = getExistingRef(ref, isRoot)
    if (res) return res

    const refCode = localRefCode(ref)
    let schOrFunc = resolve.call(self, localCompile, root, ref)
    if (schOrFunc === undefined) {
      const localSchema = localRefs && localRefs[ref]
      if (localSchema) {
        schOrFunc = inlineRef(localSchema, opts.inlineRefs)
          ? localSchema
          : compileSchema.call(self, {schema: localSchema, root, localRefs, baseId: _baseId})
      }
    }

    if (schOrFunc === undefined) {
      removeLocalRef(ref)
    } else {
      replaceLocalRef(ref, schOrFunc)
      return resolvedRef(schOrFunc, refCode)
    }
  }

  function getExistingRef(ref: string, isRoot: boolean): ResolvedRef | void {
    const idx = refs[ref]
    if (idx !== undefined) {
      const schOrFunc = refVal[idx]
      return resolvedRef(schOrFunc, _`refVal[${idx}]`)
    }
    if (!isRoot && root.refs) {
      // TODO root.refs check should be unnecessary, it is only needed because in some cases root is passed without refs (see type casts to SchemaRoot)
      const rootIdx = root.refs[ref]
      if (rootIdx !== undefined) {
        const schOrFunc = root.refVal[rootIdx]
        return resolvedRef(schOrFunc, localRefCode(ref, schOrFunc))
      }
    }
  }

  // TODO gen.globals
  function localRefCode(ref: string, schOrFunc?: RefVal): Code {
    const refId = refVal.length
    refVal[refId] = schOrFunc
    refs[ref] = refId
    return _`refVal${refId}`
  }

  // TODO gen.globals remove?
  function removeLocalRef(ref: string) {
    delete refs[ref]
  }

  // TODO gen.globals remove?
  function replaceLocalRef(ref: string, schOrFunc: RefVal) {
    const refId = refs[ref]
    if (refId !== undefined) refVal[refId] = schOrFunc
  }

  function resolvedRef(schOrFunc: RefVal | undefined, code: Code): ResolvedRef {
    return typeof schOrFunc == "object" || typeof schOrFunc == "boolean"
      ? {code: code, schema: schOrFunc, inline: true}
      : {code: code, $async: schOrFunc && !!schOrFunc.$async}
  }
}

// Index of schema compilation in the currently compiled list
function getCompilation(this: Ajv, env: CompileEnv): Compilation | void {
  for (const c of this._compilations) {
    if (equalEnv(c, env)) return c
  }
}

function equalEnv(e1: CompileEnv, e2: CompileEnv): boolean {
  return e1.schema === e2.schema && e1.root === e2.root && e1.baseId === e2.baseId
}

function refValCode(i: number, refVal: (RefVal | undefined)[]): Code {
  return refVal[i] === undefined ? nil : _`const refVal${i} = refVal[${i}];`
}

function vars(
  arr: (RefVal | undefined)[],
  statement: (i: number, arr: (RefVal | undefined)[]) => Code
): Code {
  return arr.map((_el, i) => statement(i, arr)).reduce((res: Code, c: Code) => _`${res}${c}`, nil)
}

// resolve and compile the references ($ref)
// TODO returns SchemaObject (if the schema can be inlined) or validation function
function resolve(
  this: Ajv,
  localCompile: (env: SchemaEnv) => ValidateFunction, // reference to schema compilation function (localCompile)
  root: SchemaRoot, // information about the root schema for the current schema
  ref: string // reference to resolve
): RefVal | undefined {
  let schOrRef = this._refs[ref]
  if (typeof schOrRef == "string") {
    if (this._refs[schOrRef]) schOrRef = this._refs[schOrRef]
    else return resolve.call(this, localCompile, root, schOrRef)
  }

  schOrRef = schOrRef || this._schemas[ref]
  if (schOrRef instanceof StoredSchema) {
    return inlineRef(schOrRef.schema, this._opts.inlineRefs)
      ? schOrRef.schema
      : schOrRef.validate || compileStoredSchema.call(this, schOrRef)
  }

  const env = resolveSchema.call(this, root, ref)
  let schema, baseId
  if (env) {
    schema = env.schema
    root = env.root
    baseId = env.baseId
  }

  if (schema instanceof StoredSchema) {
    if (!schema.validate) {
      schema.validate = localCompile.call(this, {schema: schema.schema, root, baseId})
    }
    return schema.validate
  }
  if (schema !== undefined) {
    return inlineRef(schema, this._opts.inlineRefs)
      ? schema
      : localCompile.call(this, {schema, root, baseId})
  }
  return undefined
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
    const id = normalizeId(refPath)
    let schOrRef = this._refs[id]
    if (typeof schOrRef == "string") {
      return resolveRecursive.call(this, root, schOrRef, p)
    }
    if (schOrRef instanceof StoredSchema) {
      if (!schOrRef.validate) compileStoredSchema.call(this, schOrRef)
      root = <SchemaRoot>schOrRef
    } else {
      schOrRef = this._schemas[id]
      if (schOrRef instanceof StoredSchema) {
        if (!schOrRef.validate) compileStoredSchema.call(this, schOrRef)
        if (id === normalizeId(ref)) {
          return {schema: schOrRef, root, baseId}
        }
        root = <SchemaRoot>schOrRef
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

const PREVENT_SCOPE_CHANGE = toHash([
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
    if (typeof schema == "boolean") return
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
    !schemaHasRulesButRef({schema, RULES: this.RULES})
  ) {
    const $ref = resolveUrl(baseId, schema.$ref)
    const _env = resolveSchema.call(this, root, $ref)
    if (_env && !isRootEnv(_env)) return _env
  }
  const env = {schema, root, baseId}
  if (!isRootEnv(env)) return env
  return undefined
}

function isRootEnv({schema, root}: SchemaEnv): boolean {
  return schema === root.schema
}
