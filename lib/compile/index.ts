import Ajv from "../ajv"
import CodeGen, {_, str, nil, Code, Scope} from "./codegen"
import {validateFunctionCode} from "./validate"
import {Schema, SchemaObject, ValidateFunction} from "../types"
import N from "./names"

const equal = require("fast-deep-equal")
const ucs2length = require("./ucs2length")

const resolve = require("./resolve")

/**
 * Functions below are used inside compiled validations function
 */

// this error is thrown by async schemas to return validation errors via exception
const ValidationError = require("./error_classes").ValidationError

module.exports = compile

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

export class SchemaEnv {
  schema: Schema
  root: SchemaRoot
  baseId: string
  constructor(schema: Schema, root: SchemaRoot, baseId: string) {
    this.schema = schema
    this.root = root
    this.baseId = baseId
  }

  equal(env: SchemaEnv): boolean {
    return this.schema === env.schema && this.root === env.root && this.baseId === env.baseId
  }
}

export interface Compilation extends SchemaEnv {
  validate?: ValidateFunction
  callValidate?: ValidateFunction
}

// Compiles schema to validation function
function compile(
  this: Ajv,
  schema: SchemaObject, // TODO or SchemaObject?
  root: SchemaRoot, // object with information about the root schema for this schema
  localRefs, // the hash of local references inside the schema (created by resolve.id), used for inline resolution
  baseId: string // base ID for IDs in the schema
) {
  /* eslint no-shadow: 0 */
  var self = this,
    opts = this._opts,
    refVal = [undefined],
    refs: {[ref: string]: number} = {}

  const scope: Scope = {}

  root = root || {schema, refVal, refs}

  const env = new SchemaEnv(schema, root, baseId)
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

  function localCompile(_schema: SchemaObject, _root: SchemaRoot, localRefs, baseId: string) {
    var isRoot = !_root || (_root && _root.schema === _schema)
    if (_root.schema !== root.schema) {
      return compile.call(self, _schema, _root, localRefs, baseId)
    }

    var $async = _schema.$async === true
    const rootId = resolve.fullPath(_root.schema.$id)

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
      async: _schema.$async === true,
      schema: _schema,
      isRoot,
      root: _root,
      rootId,
      baseId: baseId || rootId,
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

  function resolveRef(baseId: string, ref: string, isRoot: boolean): ResolvedRef | void {
    ref = resolve.url(baseId, ref)
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
    var v = resolve.call(self, localCompile, root, ref)
    if (v === undefined) {
      var localSchema = localRefs && localRefs[ref]
      if (localSchema) {
        v = resolve.inlineRef(localSchema, opts.inlineRefs)
          ? localSchema
          : compile.call(self, localSchema, root, localRefs, baseId)
      }
    }

    if (v === undefined) {
      removeLocalRef(ref)
    } else {
      replaceLocalRef(ref, v)
      return resolvedRef(v, refCode)
    }
  }

  // TODO gen.globals
  function addLocalRef(ref: string, v?: any): Code {
    var refId = refVal.length
    refVal[refId] = v
    refs[ref] = refId
    return _`refVal${refId}`
  }

  // TODO gen.globals remove?
  function removeLocalRef(ref: string) {
    delete refs[ref]
  }

  // TODO gen.globals remove?
  function replaceLocalRef(ref, v) {
    var refId = refs[ref]
    refVal[refId] = v
  }

  function resolvedRef(refVal, code: Code): ResolvedRef {
    return typeof refVal == "object" || typeof refVal == "boolean"
      ? {code: code, schema: refVal, inline: true}
      : {code: code, $async: refVal && !!refVal.$async}
  }
}

// Index of schema compilation in the currently compiled list
function getCompilation(this: Ajv, env: SchemaEnv): Compilation | void {
  for (const c of this._compilations) {
    if (c.equal(env)) return c
  }
}

function refValCode(i: number, refVal): Code {
  return refVal[i] === undefined ? nil : _`const refVal${i} = refVal[${i}];`
}

function vars(arr: unknown[], statement: (i: number, arr?: unknown[]) => Code): Code {
  return arr
    .map((_el, i, arr) => statement(i, arr))
    .reduce((res: Code, c: Code) => _`${res}${c}`, nil)
}
