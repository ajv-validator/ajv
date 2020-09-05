import {Schema, SchemaObject, ValidateFunction} from "../types"
import CodeGen, {_, nil, str, Code, Scope} from "./codegen"
import N from "./names"
import {LocalRefs, getFullPath, inlineRef, resolve, resolveUrl} from "./resolve"
import {validateFunctionCode} from "./validate"
import Ajv from "../ajv"

const equal = require("fast-deep-equal")
const ucs2length = require("./ucs2length")

/**
 * Functions below are used inside compiled validations function
 */

// this error is thrown by async schemas to return validation errors via exception
const ValidationError = require("./error_classes").ValidationError

export type ResolvedRef = InlineResolvedRef | FuncResolvedRef

export interface InlineResolvedRef {
  code: Code
  schema: object | boolean
  inline: true
}

export interface FuncResolvedRef {
  code: Code
  $async?: boolean
  inline?: false
}

export interface SchemaRoot {
  schema: SchemaObject
  refVal: (string | undefined)[]
  refs: {[ref: string]: number}
}

export interface SchemaEnv {
  schema: Schema
  root: SchemaRoot
  baseId?: string
}

export interface Compilation extends SchemaEnv {
  validate?: ValidateFunction
  callValidate?: ValidateFunction
}

// Compiles schema to validation function
export function compileSchema(
  this: Ajv,
  schema: Schema,
  passedRoot?: SchemaRoot, // object with information about the root schema for this schema
  localRefs?: LocalRefs, // the hash of local references inside the schema (created by resolve.id), used for inline resolution
  baseId?: string // base ID for IDs in the schema
): ValidateFunction {
  var self = this,
    opts = this._opts,
    refVal = [undefined],
    refs: {[ref: string]: number} = {}

  const scope: Scope = {}

  const root: SchemaRoot = passedRoot || {
    schema: typeof schema == "boolean" ? {} : schema,
    refVal,
    refs,
  }

  const env = {schema, root, baseId}
  let compilation = getCompilation.call(this, env)

  if (compilation) {
    const c: Compilation = compilation
    if (!c.callValidate) {
      const validate: ValidateFunction = function (this: Ajv | any, ...args) {
        const v = <ValidateFunction>c.validate
        const valid = v.apply(this, args)
        validate.errors = v.errors
        return valid
      }
      c.callValidate = validate
    }
    return c.callValidate
  }

  compilation = env
  this._compilations.add(compilation)

  var formats = this._formats
  var RULES = this.RULES

  try {
    var v = localCompile(schema, root, localRefs, baseId)
    compilation.validate = v
    var cv = compilation.callValidate
    if (cv) {
      cv.schema = v.schema
      cv.errors = null
      cv.refs = v.refs
      cv.refVal = v.refVal
      cv.root = v.root
      cv.$async = v.$async
      if (opts.sourceCode) cv.source = v.source
    }
    return v
  } finally {
    this._compilations.delete(compilation)
  }

  function localCompile(
    _schema: Schema,
    _root: SchemaRoot,
    _localRefs?: LocalRefs,
    _baseId?: string
  ): ValidateFunction {
    var isRoot = !_root || (_root && _root.schema === _schema)
    if (_root.schema !== root.schema) {
      return compileSchema.call(self, _schema, _root, _localRefs, _baseId)
    }

    var $async = typeof _schema == "object" && _schema.$async === true
    const rootId = getFullPath(_root.schema.$id)

    const gen = new CodeGen({...opts.codegen, forInOwn: opts.ownProperties})

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
      schema: _schema,
      isRoot,
      root: _root,
      rootId,
      baseId: _baseId || rootId,
      schemaPath: nil,
      errSchemaPath: "#",
      errorPath: str``,
      RULES, // TODO refactor - it is available on the instance
      formats,
      opts,
      resolveRef, // TODO move to gen.globals
      logger: self.logger,
      self,
    })

    let sourceCode = `${vars(refVal, refValCode)}
                      ${gen.scopeRefs(N.scope, scope)}
                      ${gen.toString()}`

    if (opts.processCode) sourceCode = opts.processCode(sourceCode, _schema)
    // console.log("\n\n\n *** \n", sourceCode)
    var validate
    try {
      // TODO refactor to fewer variables - maybe only self and scope
      var makeValidate = new Function(
        "self",
        "RULES",
        "formats",
        "root",
        "refVal",
        "scope",
        "equal",
        "ucs2length",
        "ValidationError",
        sourceCode
      )

      validate = makeValidate(
        self,
        RULES,
        formats,
        root,
        refVal,
        scope,
        equal,
        ucs2length,
        ValidationError
      )

      refVal[0] = validate
    } catch (e) {
      self.logger.error("Error compiling schema, function code:", sourceCode)
      throw e
    }

    validate.schema = _schema
    validate.errors = null
    validate.refs = refs
    validate.refVal = refVal
    validate.root = isRoot ? validate : _root
    if ($async) validate.$async = true
    if (opts.sourceCode === true) {
      validate.source = {
        code: sourceCode,
        scope,
      }
    }

    return validate
  }

  function resolveRef(_baseId: string, ref: string, isRoot: boolean): ResolvedRef | void {
    ref = resolveUrl(_baseId, ref)
    var refIndex = refs[ref]
    var _refVal, refCode
    if (refIndex !== undefined) {
      _refVal = refVal[refIndex]
      refCode = _`refVal[${refIndex}]`
      return resolvedRef(_refVal, refCode)
    }
    if (!isRoot && root.refs) {
      var rootRefId = root.refs[ref]
      if (rootRefId !== undefined) {
        _refVal = root.refVal[rootRefId]
        refCode = addLocalRef(ref, _refVal)
        return resolvedRef(_refVal, refCode)
      }
    }

    refCode = addLocalRef(ref)
    let _v = resolve.call(self, localCompile, root, ref)
    if (_v === undefined) {
      var localSchema = localRefs && localRefs[ref]
      if (localSchema) {
        _v = inlineRef(localSchema, opts.inlineRefs)
          ? localSchema
          : compileSchema.call(self, localSchema, root, localRefs, _baseId)
      }
    }

    if (_v === undefined) {
      removeLocalRef(ref)
    } else {
      replaceLocalRef(ref, _v)
      return resolvedRef(_v, refCode)
    }
  }

  // TODO gen.globals
  function addLocalRef(ref: string, _v?): Code {
    var refId = refVal.length
    refVal[refId] = _v
    refs[ref] = refId
    return _`refVal${refId}`
  }

  // TODO gen.globals remove?
  function removeLocalRef(ref: string) {
    delete refs[ref]
  }

  // TODO gen.globals remove?
  function replaceLocalRef(ref: string, _v) {
    var refId = refs[ref]
    refVal[refId] = _v
  }

  function resolvedRef(_refVal, code: Code): ResolvedRef {
    return typeof _refVal == "object" || typeof _refVal == "boolean"
      ? {code: code, schema: _refVal, inline: true}
      : {code: code, $async: _refVal && !!_refVal.$async}
  }
}

// Index of schema compilation in the currently compiled list
function getCompilation(this: Ajv, env: SchemaEnv): Compilation | void {
  for (const c of this._compilations) {
    if (equalEnv(c, env)) return c
  }
}

function equalEnv(e1: SchemaEnv, e2: SchemaEnv): boolean {
  return e1.schema === e2.schema && e1.root === e2.root && e1.baseId === e2.baseId
}

function refValCode(i: number, refVal): Code {
  return refVal[i] === undefined ? nil : _`const refVal${i} = refVal[${i}];`
}

function vars(arr: unknown[], statement: (i: number, arr?: unknown[]) => Code): Code {
  return arr.map((_el, i) => statement(i, arr)).reduce((res: Code, c: Code) => _`${res}${c}`, nil)
}
