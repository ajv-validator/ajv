import type {Schema, SchemaObject, ValidateFunction, SchemaCxt} from "../types"
import type Ajv from "../ajv"
import {CodeGen, _, nil, str, Code, Name} from "./codegen"
import {ValidationError} from "./error_classes"
import N from "./names"
import {LocalRefs, getFullPath, _getFullPath, inlineRef, normalizeId, resolveUrl} from "./resolve"
import {toHash, schemaHasRulesButRef, unescapeFragment} from "./util"
import {validateFunctionCode} from "./validate"
import URI = require("uri-js")

/**
 * Functions below are used inside compiled validations function
 */

interface _StoredSchema {
  schema: Schema
  id?: string
  ref?: string
  cacheKey?: unknown
  fragment?: true
  meta?: boolean
  root?: SchemaRoot
  localRoot?: {validate?: ValidateFunction}
  refs?: {[ref: string]: number | undefined}
  refVal?: (RefVal | undefined)[]
  localRefs?: LocalRefs
  baseId?: string
  validate?: ValidateFunction
  validateName?: Name
}

export class StoredSchema implements _StoredSchema {
  schema: Schema
  id?: string
  ref?: string
  cacheKey?: unknown
  fragment?: true
  meta?: boolean
  root?: SchemaRoot
  localRoot?: {validate?: ValidateFunction}
  refs?: {[ref: string]: number | undefined}
  refVal?: (RefVal | undefined)[]
  localRefs?: LocalRefs
  baseId?: string
  validate?: ValidateFunction
  validateName?: Name

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
  localRoot: {validate?: ValidateFunction}
  refVal: (RefVal | undefined)[]
  refs: {[ref: string]: number | undefined}
}

interface SchemaEnv {
  schema: Schema
  root: SchemaRoot
  localRefs?: LocalRefs
  baseId?: string
}

export function compileStoredSchema(this: Ajv, schObj: StoredSchema): ValidateFunction {
  return (schObj.meta ? compileMetaSchema : compileSchema).call(this, schObj)
}

function schemaScopeCode(this: Ajv, sch: StoredSchema): Name {
  return this._scope.value("validate", {ref: sch}, "schema", "validate")
}

function compileMetaSchema(this: Ajv, schObj: StoredSchema): ValidateFunction {
  const currentOpts = this._opts
  this._opts = this._metaOpts
  try {
    return compileSchema.call(this, schObj)
  } finally {
    this._opts = currentOpts
  }
}

function validateWrapper(sch: StoredSchema): ValidateFunction {
  if (!sch.validate) {
    const wrapper: ValidateFunction = function (this: Ajv | unknown, ...args) {
      if (wrapper.validate === undefined) throw new Error("ajv implementation error")
      const v = wrapper.validate
      const valid = v.apply(this, args)
      wrapper.errors = v.errors
      return valid
    }
    sch.validate = wrapper
  }
  return sch.validate
}

function extendWrapper(wrapper: ValidateFunction, v: ValidateFunction): void {
  wrapper.validate = v
  Object.assign(wrapper, v)
}

// Compiles schema to validation function
function compileSchema(this: Ajv, schObj: StoredSchema): ValidateFunction {
  const {localRefs} = schObj
  const self = this
  const opts = this._opts
  const refVal: (RefVal | undefined)[] = []
  const refs: {[ref: string]: number | undefined} = {}
  const localRoot: {validate?: ValidateFunction} = {}
  if (schObj.root === undefined) {
    schObj.root = {
      schema: typeof schObj.schema == "boolean" ? {} : schObj.schema,
      localRoot,
      refVal,
      refs,
    }
  }
  const root = schObj.root
  return (localRoot.validate = localCompile(schObj))

  function localCompile(sch: StoredSchema): ValidateFunction {
    // TODO refactor - remove compilations
    const _sch = getCompilingSchema.call(self, sch)
    if (_sch) return validateWrapper(_sch)
    // validateWrapper(sch)
    const {schema, baseId} = sch
    if (sch.root === undefined || sch.root !== root) {
      return compileSchema.call(self, sch)
    }
    const isRoot = sch.schema === sch.root.schema
    const $async = typeof schema == "object" && schema.$async === true
    const rootId = getFullPath(sch.root.schema.$id)

    const gen = new CodeGen(self._scope, {...opts.codegen, forInOwn: opts.ownProperties})
    let _ValidationError
    if ($async) {
      _ValidationError = gen.scopeValue("Error", {
        ref: ValidationError,
        code: _`require("ajv/dist/compile/error_classes").ValidationError`,
      })
    }

    const validateName = schemaScopeCode.call(self, sch)

    const schemaCxt: SchemaCxt = {
      gen,
      allErrors: !!opts.allErrors,
      data: N.data,
      parentData: N.parentData,
      parentDataProperty: N.parentDataProperty,
      dataNames: [N.data],
      dataPathArr: [nil],
      dataLevel: 0,
      topSchemaRef: _`${validateName}.schema`, // TODO maybe use validateName instead of topSchemaRef?
      async: $async,
      validateName,
      ValidationError: _ValidationError,
      schema: schema,
      isRoot,
      root,
      rootId,
      baseId: baseId || rootId,
      schemaPath: nil,
      errSchemaPath: "#",
      errorPath: str``,
      opts,
      resolveRef, // TODO move to gen.globals
      self,
    }

    let sourceCode
    try {
      self._compilations.add(sch)
      validateFunctionCode(schemaCxt)
      sourceCode = `${vars(refVal, refValCode)}
                    ${gen.scopeRefs(N.scope)}
                    ${gen.toString()}`
      if (opts.processCode) sourceCode = opts.processCode(sourceCode, schema)
      // console.log("\n\n\n *** \n", sourceCode)
      // TODO refactor to fewer variables - maybe only self and scope
      const makeValidate = new Function(N.self.toString(), "refVal", N.scope.toString(), sourceCode)
      const validate: ValidateFunction = makeValidate(self, refVal, self._scope.get())

      validate.schema = schema
      validate.errors = null
      sch.refs = validate.refs = refs
      sch.refVal = validate.refVal = refVal
      sch.localRoot = validate.localRoot = localRoot
      sch.root = validate.root = isRoot ? root : sch.root
      if ($async) validate.$async = true
      if (opts.sourceCode === true) {
        validate.source = {
          code: sourceCode,
          scope: self._scope,
        }
      }
      if (sch.validate) extendWrapper(sch.validate, validate)
      sch.validate = validate
      return validate
    } catch (e) {
      delete sch.validate
      delete sch.validateName
      if (sourceCode) self.logger.error("Error compiling schema, function code:", sourceCode)
      throw e
    } finally {
      self._compilations.delete(sch)
    }
  }

  function resolveRef(baseId: string, ref: string, isRoot: boolean): ResolvedRef | void {
    ref = resolveUrl(baseId, ref)
    const res = getExistingRef(ref, isRoot)
    if (res) return res
    const refCode = localRefCode(ref)
    let _sch = resolve.call(self, root, ref)
    if (_sch === undefined) {
      const schema = localRefs && localRefs[ref]
      if (schema) _sch = {schema, root, localRefs, baseId}
    }

    if (_sch === undefined) {
      removeLocalRef(ref)
    } else {
      const schOrFunc = inlineOrCompile.call(self, _sch)
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

  function inlineOrCompile(this: Ajv, sch: StoredSchema): RefVal {
    return inlineRef(sch.schema, this._opts.inlineRefs)
      ? sch.schema
      : sch.validate || localCompile.call(this, sch)
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
function getCompilingSchema(this: Ajv, schObj: StoredSchema): StoredSchema | void {
  for (const sch of this._compilations) {
    if (sameSchema(sch, schObj)) return sch
  }
}

function sameSchema(s1: StoredSchema, s2: StoredSchema): boolean {
  return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId
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
  root: SchemaRoot, // information about the root schema for the current schema
  ref: string // reference to resolve
): StoredSchema | undefined {
  // ): RefVal | undefined | Name | StoredSchema {
  let schOrRef = this._refs[ref]
  while (typeof schOrRef == "string") {
    ref = schOrRef
    schOrRef = this._refs[ref]
  }
  if (schOrRef instanceof StoredSchema) return schOrRef
  const env = resolveSchema.call(this, root, ref)
  // TODO why env.schema can be StoredSchema?
  if (env) return env.schema instanceof StoredSchema ? env.schema : env
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
      if (!schOrRef.validate) compileSchema.call(this, schOrRef)
      root = <SchemaRoot>schOrRef
    } else {
      schOrRef = this._schemas[id]
      if (schOrRef instanceof StoredSchema) {
        if (!schOrRef.validate) compileSchema.call(this, schOrRef)
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
  if (parsedRef.fragment?.[0] !== "/") return
  for (const part of parsedRef.fragment.slice(1).split("/")) {
    if (typeof schema == "boolean") return
    schema = schema[unescapeFragment(part)]
    if (schema === undefined) return
    // TODO PREVENT_SCOPE_CHANGE could be defined in keyword def?
    if (!PREVENT_SCOPE_CHANGE[part] && typeof schema == "object" && schema.$id) {
      baseId = resolveUrl(baseId, schema.$id)
    }
  }
  let env: SchemaEnv | undefined
  if (typeof schema != "boolean" && schema.$ref && !schemaHasRulesButRef(schema, this.RULES)) {
    const $ref = resolveUrl(baseId, schema.$ref)
    env = resolveSchema.call(this, root, $ref)
  }
  // even though resolution failed we need to return SchemaEnv to throw exception
  // so that compileAsync loads missing schema.
  env = env || {schema, root, baseId}
  if (env.schema !== env.root.schema) return env
  return undefined
}
