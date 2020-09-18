import type {
  AnySchema,
  AnySchemaObject,
  AnyValidateFunction,
  AsyncValidateFunction,
  SchemaCxt,
} from "../types"
import type Ajv from "../ajv"
import {CodeGen, _, nil, str, Name} from "./codegen"
import {ValidationError} from "./error_classes"
import N from "./names"
import {LocalRefs, getFullPath, _getFullPath, inlineRef, normalizeId, resolveUrl} from "./resolve"
import {toHash, schemaHasRulesButRef, unescapeFragment} from "./util"
import {validateFunctionCode} from "./validate"
import URI = require("uri-js")

export interface SchemaRefs {
  [ref: string]: SchemaEnv | AnySchema | undefined
}

interface SchemaEnvArgs {
  schema: AnySchema
  root?: SchemaEnv
  baseId?: string
  localRefs?: LocalRefs
  meta?: boolean
  cacheKey?: unknown
}

export class SchemaEnv implements SchemaEnvArgs {
  readonly schema: AnySchema
  readonly root: SchemaEnv
  baseId: string // TODO possibly, it should be readonly
  localRefs?: LocalRefs
  readonly meta?: boolean
  readonly cacheKey?: unknown
  readonly $async?: boolean
  readonly refs: SchemaRefs = {}
  validate?: AnyValidateFunction
  validateName?: Name

  constructor(env: SchemaEnvArgs) {
    let schema: AnySchemaObject | undefined
    if (typeof env.schema == "object") schema = env.schema
    this.schema = env.schema
    this.root = env.root || this
    this.baseId = env.baseId ?? normalizeId(schema?.$id)
    this.localRefs = env.localRefs
    this.meta = env.meta
    this.cacheKey = env.cacheKey
    this.$async = schema?.$async
    this.refs = {}
  }
}

// Compiles schema in SchemaEnv
export function compileSchema(this: Ajv, sch: SchemaEnv): SchemaEnv {
  // TODO refactor - remove compilations
  const _sch = getCompilingSchema.call(this, sch)
  if (_sch) return _sch
  const rootId = getFullPath(sch.root.baseId) // TODO if getFullPath removed 1 tests fails
  const gen = new CodeGen(this.scope, {...this.opts.codegen, forInOwn: this.opts.ownProperties})
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
    allErrors: this.opts.allErrors,
    data: N.data,
    parentData: N.parentData,
    parentDataProperty: N.parentDataProperty,
    dataNames: [N.data],
    dataPathArr: [nil], // TODO can its lenght be used as dataLevel if nil is removed?
    dataLevel: 0,
    topSchemaRef: gen.scopeValue("schema", {ref: sch.schema}),
    validateName,
    ValidationError: _ValidationError,
    schema: sch.schema,
    schemaEnv: sch,
    rootId,
    baseId: sch.baseId || rootId,
    schemaPath: nil,
    errSchemaPath: "#",
    errorPath: str``,
    opts: this.opts,
    self: this,
  }

  let sourceCode
  try {
    this._compilations.add(sch)
    validateFunctionCode(schemaCxt)
    sourceCode = `${gen.scopeRefs(N.scope)}${gen}`
    if (this.opts.processCode) sourceCode = this.opts.processCode(sourceCode, sch)
    // console.log("\n\n\n *** \n", sourceCode)
    const makeValidate = new Function(`${N.self}`, `${N.scope}`, sourceCode)
    const validate: AnyValidateFunction = makeValidate(this, this.scope.get())
    gen.scopeValue(validateName, {ref: validate})

    validate.errors = null
    validate.schema = sch.schema
    validate.schemaEnv = sch
    if (sch.$async) (validate as AsyncValidateFunction).$async = true
    if (this.opts.sourceCode === true) {
      validate.source = {
        code: sourceCode,
        scope: this.scope,
      }
    }
    sch.validate = validate
    return sch
  } catch (e) {
    delete sch.validate
    delete sch.validateName
    if (sourceCode) this.logger.error("Error compiling schema, function code:", sourceCode)
    throw e
  } finally {
    this._compilations.delete(sch)
  }
}

export function resolveRef(
  this: Ajv,
  root: SchemaEnv,
  baseId: string,
  ref: string
): AnySchema | AnyValidateFunction | SchemaEnv | undefined {
  ref = resolveUrl(baseId, ref)
  const schOrFunc = root.refs[ref]
  if (schOrFunc) return schOrFunc

  let _sch = resolve.call(this, root, ref)
  if (_sch === undefined) {
    const schema = root.localRefs?.[ref] // TODO maybe localRefs should hold SchemaEnv
    if (schema) _sch = new SchemaEnv({schema, root, baseId})
  }

  if (_sch === undefined) return
  return (root.refs[ref] = inlineOrCompile.call(this, _sch))
}

function inlineOrCompile(this: Ajv, sch: SchemaEnv): AnySchema | SchemaEnv {
  if (inlineRef(sch.schema, this.opts.inlineRefs)) return sch.schema
  return sch.validate ? sch : compileSchema.call(this, sch)
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
// TODO returns AnySchemaObject (if the schema can be inlined) or validation function
function resolve(
  this: Ajv,
  root: SchemaEnv, // information about the root schema for the current schema
  ref: string // reference to resolve
): SchemaEnv | undefined {
  let sch
  while (typeof (sch = this.refs[ref]) == "string") ref = sch
  return sch || this.schemas[ref] || resolveSchema.call(this, root, ref)
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
  const schOrRef = this.refs[id] || this.schemas[id]
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
