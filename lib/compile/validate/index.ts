import {Schema, SchemaCtx, SchemaObjCtx, Options} from "../../types"
import {boolOrEmptySchema, topBoolOrEmptySchema} from "./boolSchema"
import {coerceAndCheckDataType, getSchemaTypes} from "./dataType"
import {schemaKeywords} from "./iterate"
import {CodeGen, _, nil, str, Block, Code, Name} from "../codegen"
import N from "../names"
import {resolveUrl} from "../resolve"
import {schemaCtxHasRules, schemaHasRulesButRef} from "../util"
import {checkStrictMode, checkUnknownRules} from "../../vocabularies/util"

// schema compilation - generates validation function, subschemaCode (below) is used for subschemas
export function validateFunctionCode(it: SchemaCtx): void {
  if (isSchemaObj(it)) {
    checkKeywords(it)
    if (schemaCtxHasRules(it)) {
      topSchemaObjCode(it)
      return
    }
  }
  validateFunction(it, () => topBoolOrEmptySchema(it))
}

function validateFunction({gen, schema, async, opts}: SchemaCtx, body: Block) {
  gen.return(() =>
    gen.func(
      N.validate,
      _`${N.data}, ${N.dataPath}, ${N.parentData}, ${N.parentDataProperty}, ${N.rootData}`,
      async,
      () => gen.code(_`"use strict"; ${funcSourceUrl(schema, opts)}`).code(body)
    )
  )
}

function topSchemaObjCode(it: SchemaObjCtx): void {
  const {schema, opts} = it
  validateFunction(it, () => {
    if (opts.$comment && schema.$comment) commentKeyword(it)
    checkNoDefault(it)
    initializeTop(it.gen)
    typeAndKeywords(it)
    returnResults(it)
  })
  return
}

function funcSourceUrl(schema: Schema, opts: Options): Code {
  return typeof schema == "object" && schema.$id && (opts.sourceCode || opts.processCode)
    ? _`/*# sourceURL=${schema.$id} */`
    : nil
}

// schema compilation - this function is used recursively to generate code for sub-schemas
export function subschemaCode(it: SchemaCtx, valid: Name): void {
  if (isSchemaObj(it)) {
    checkKeywords(it)
    if (schemaCtxHasRules(it)) {
      subSchemaObjCode(it, valid)
      return
    }
  }
  boolOrEmptySchema(it, valid)
}

function isSchemaObj(it: SchemaCtx): it is SchemaObjCtx {
  return typeof it.schema != "boolean"
}

function subSchemaObjCode(it: SchemaObjCtx, valid: Name): void {
  const {schema, gen, opts} = it
  if (opts.$comment && schema.$comment) commentKeyword(it)
  updateContext(it)
  checkAsync(it)
  // TODO var - async validation fails if var replaced, possibly because of nodent
  const errsCount = gen.var("_errs", N.errors)
  typeAndKeywords(it, errsCount)
  // TODO var
  gen.var(valid, _`${errsCount} === ${N.errors}`)
}

function checkKeywords(it: SchemaObjCtx) {
  checkUnknownRules(it)
  checkRefsAndKeywords(it)
}

function typeAndKeywords(it: SchemaObjCtx, errsCount?: Name): void {
  const types = getSchemaTypes(it, it.schema)
  const checkedTypes = coerceAndCheckDataType(it, types)
  schemaKeywords(it, types, !checkedTypes, errsCount)
}

function checkRefsAndKeywords(it: SchemaObjCtx): void {
  const {schema, errSchemaPath, opts, logger} = it
  if (schema.$ref && schemaHasRulesButRef(it)) {
    if (opts.extendRefs === "fail") {
      throw new Error(`$ref: sibling validation keywords at "${errSchemaPath}" (option extendRefs)`)
    } else if (opts.extendRefs !== true) {
      logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`)
    }
  }
}

function checkNoDefault(it: SchemaObjCtx): void {
  const {schema, opts} = it
  if (schema.default !== undefined && opts.useDefaults && opts.strict) {
    checkStrictMode(it, "default is ignored in the schema root")
  }
}

function initializeTop(gen: CodeGen): void {
  gen.let(N.vErrors, null)
  gen.let(N.errors, 0)
  gen.if(_`${N.rootData} === undefined`, () => gen.assign(N.rootData, N.data))
  // gen.if(_`${N.dataPath} === undefined`, () => gen.assign(N.dataPath, _`""`)) // TODO maybe add it
}

function updateContext(it: SchemaObjCtx): void {
  if (it.schema.$id) it.baseId = resolveUrl(it.baseId, it.schema.$id)
}

function checkAsync(it: SchemaObjCtx): void {
  if (it.schema.$async && !it.async) throw new Error("async schema in sync schema")
}

function commentKeyword({gen, schema, errSchemaPath, opts: {$comment}}: SchemaObjCtx): void {
  const msg = schema.$comment
  if ($comment === true) {
    gen.code(_`console.log(${msg})`) // should it use logger?
  } else if (typeof $comment == "function") {
    const schemaPath = str`${errSchemaPath}/$comment`
    gen.code(_`${N.self}._opts.$comment(${msg}, ${schemaPath}, ${N.validate}.root.schema)`)
  }
}

function returnResults({gen, async, ValidationError}: SchemaCtx) {
  if (async) {
    gen.if(
      _`${N.errors} === 0`,
      () => gen.return(N.data),
      _`throw new ${ValidationError as Name}(${N.vErrors})`
    )
  } else {
    gen.assign(_`${N.validate}.errors`, N.vErrors)
    gen.return(_`${N.errors} === 0`)
  }
}
