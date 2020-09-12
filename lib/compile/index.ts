import type {Schema, SchemaObject, ValidateFunction, SchemaCxt} from "../types"
import type Ajv from "../ajv"
import {CodeGen, _, nil, str, Name} from "./codegen"
import {ValidationError} from "./error_classes"
import N from "./names"
import {LocalRefs, getFullPath, _getFullPath, inlineRef, normalizeId, resolveUrl} from "./resolve"
import {toHash, schemaHasRulesButRef, unescapeFragment} from "./util"
import {validateFunctionCode} from "./validate"
import URI = require("uri-js")

export interface SchemaRefs {
  [ref: string]: Schema | ValidateFunction | undefined
}

interface SchemaEnvArgs {
  schema: Schema
  root?: SchemaEnv
  baseId?: string
  localRefs?: LocalRefs
  meta?: boolean
  cacheKey?: unknown
}

export class SchemaEnv implements SchemaEnvArgs {
  schema: Schema
  root: SchemaEnv
  baseId: string
  localRefs?: LocalRefs
  meta?: boolean
  cacheKey?: unknown
  $async?: boolean
  localRoot: {validate?: ValidateFunction}
  refs: SchemaRefs = {}
  validate?: ValidateFunction
  validateName?: Name

  constructor(env: SchemaEnvArgs) {
    let schema: SchemaObject | undefined
    if (typeof env.schema == "object") schema = env.schema
    this.schema = env.schema
    this.root = env.root || this
    this.baseId = env.baseId ?? normalizeId(schema?.$id)
    this.localRefs = env.localRefs
    this.meta = env.meta
    this.cacheKey = env.cacheKey
    this.$async = schema?.$async
    this.localRoot = {}
    this.refs = {}
  }
}

// Compiles schema in SchemaEnv
export function compileSchema(this: Ajv, env: SchemaEnv): void {
  const self = this
  const opts = this._opts
  localCompile(env)
  if (env.validate) env.localRoot.validate = env.validate

  function localCompile(sch: SchemaEnv): SchemaEnv {
    // TODO refactor - remove compilations
    const _sch = getCompilingSchema.call(self, sch)
    if (_sch) return _sch
    const {schema, baseId} = sch
    if (sch.root !== env.root) {
      compileSchema.call(self, sch)
      return sch
    }

    const isRoot = sch.schema === sch.root.schema
    const rootId = getFullPath(sch.root.baseId)

    const gen = new CodeGen(self._scope, {...opts.codegen, forInOwn: opts.ownProperties})
    let _ValidationError
    if (sch.$async) {
      _ValidationError = gen.scopeValue("Error", {
        ref: ValidationError,
        code: _`require("ajv/dist/compile/error_classes").ValidationError`,
      })
    }

    const validateName = gen.scopeName("validate")
    sch.validateName = validateName

    const schemaCxt: SchemaCxt = {
      gen,
      allErrors: opts.allErrors,
      data: N.data,
      parentData: N.parentData,
      parentDataProperty: N.parentDataProperty,
      dataNames: [N.data],
      dataPathArr: [nil], // TODO can it's lenght be used as dataLevel if nil is removed?
      dataLevel: 0,
      topSchemaRef: gen.scopeValue("schema", {ref: schema}),
      async: sch.$async,
      validateName,
      ValidationError: _ValidationError,
      schema,
      isRoot,
      root: sch.root,
      rootId,
      baseId: baseId || rootId,
      schemaPath: nil,
      errSchemaPath: "#",
      errorPath: str``,
      opts,
      resolveRef, // TODO move to gen.scopeValue?
      self,
    }

    let sourceCode
    try {
      self._compilations.add(sch)
      validateFunctionCode(schemaCxt)
      sourceCode = `${gen.scopeRefs(N.scope)}
                    ${gen.toString()}`
      if (opts.processCode) sourceCode = opts.processCode(sourceCode, schema)
      // console.log("\n\n\n *** \n", sourceCode)
      const makeValidate = new Function(N.self.toString(), N.scope.toString(), sourceCode)
      const validate: ValidateFunction = makeValidate(self, self._scope.get())

      gen.scopeValue(validateName, {ref: validate})

      validate.schema = schema
      validate.errors = null
      validate.root = sch.root // TODO remove - only used by $comment keyword
      validate.env = sch
      if (sch.$async) validate.$async = true
      if (opts.sourceCode === true) {
        validate.source = {
          code: sourceCode,
          scope: self._scope,
        }
      }
      sch.validate = validate
      return sch
    } catch (e) {
      delete sch.validate
      delete sch.validateName
      if (sourceCode) self.logger.error("Error compiling schema, function code:", sourceCode)
      throw e
    } finally {
      self._compilations.delete(sch)
    }
  }

  function resolveRef(
    baseId: string,
    ref: string
  ): Schema | ValidateFunction | SchemaEnv | undefined {
    ref = resolveUrl(baseId, ref)
    const schOrFunc = env.refs[ref] || env.root.refs[ref]
    if (schOrFunc) return schOrFunc

    let _sch = resolve.call(self, env.root, ref)
    if (_sch === undefined) {
      const schema = env.localRefs?.[ref] // TODO maybe localRefs should hold SchemaEnv
      if (schema) _sch = new SchemaEnv({schema, root: env.root, localRefs: env.localRefs, baseId})
    }

    if (_sch !== undefined) return (env.refs[ref] = inlineOrCompile(_sch))
    return
  }

  function inlineOrCompile(sch: SchemaEnv): Schema | SchemaEnv {
    if (inlineRef(sch.schema, self._opts.inlineRefs)) return sch.schema
    return sch.validate ? sch : localCompile(sch)
  }
}

// Index of schema compilation in the currently compiled list
function getCompilingSchema(this: Ajv, schEnv: SchemaEnv): SchemaEnv | void {
  for (const sch of this._compilations) {
    if (sameSchemaEnv(sch, schEnv)) return sch
  }
}

function sameSchemaEnv(s1: SchemaEnv, s2: SchemaEnv): boolean {
  return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId
}

// resolve and compile the references ($ref)
// TODO returns SchemaObject (if the schema can be inlined) or validation function
function resolve(
  this: Ajv,
  root: SchemaEnv, // information about the root schema for the current schema
  ref: string // reference to resolve
): SchemaEnv | undefined {
  let sch
  while (typeof (sch = this._refs[ref]) == "string") ref = sch
  return sch || this._schemas[ref] || resolveSchema.call(this, root, ref)
}

// Resolve schema, its root and baseId
export function resolveSchema(
  this: Ajv,
  root: SchemaEnv, // root object with properties schema, refs TODO below SchemaEnv is assigned to it
  ref: string // reference to resolve
): SchemaEnv | undefined {
  const p = URI.parse(ref)
  const refPath = _getFullPath(p)
  const baseId = getFullPath(root.baseId)
  // TODO `Object.keys(root.schema).length > 0` should not be needed - but removing breaks 2 tests
  if (Object.keys(root.schema).length > 0 && refPath === baseId) {
    return getJsonPointer.call(this, p, root)
  }

  const id = normalizeId(refPath)
  const schOrRef = this._refs[id] || this._schemas[id]
  if (typeof schOrRef == "string") {
    const sch = resolveSchema.call(this, root, schOrRef)
    if (typeof sch?.schema !== "object") return
    // TODO review - most of the time sch.baseId == normalizeId(sch.schema.$id)
    if (sch.schema.$id) sch.baseId = resolveUrl(sch.baseId, sch.schema.$id)
    return getJsonPointer.call(this, p, sch)
  }

  if (typeof schOrRef?.schema !== "object") return
  if (!schOrRef.validate) compileSchema.call(this, schOrRef)
  if (id === normalizeId(ref)) return new SchemaEnv({schema: schOrRef.schema, root, baseId})
  return getJsonPointer.call(this, p, schOrRef)
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
  env = env || new SchemaEnv({schema, root, baseId})
  if (env.schema !== env.root.schema) return env
  return undefined
}
