import type {AnySchema} from "../../types"
import type {SchemaCxt, SchemaObjCxt} from ".."
import type {InstanceOptions} from "../../core"
import {boolOrEmptySchema, topBoolOrEmptySchema} from "./boolSchema"
import {coerceAndCheckDataType, getSchemaTypes} from "./dataType"
import {schemaKeywords} from "./iterate"
import {_, nil, str, Block, Code, Name, CodeGen} from "../codegen"
import N from "../names"
import {resolveUrl} from "../resolve"
import {schemaHasRulesButRef, checkUnknownRules} from "../util"

// schema compilation - generates validation function, subschemaCode (below) is used for subschemas
export function validateFunctionCode(it: SchemaCxt): void {
  if (isSchemaObj(it)) {
    checkKeywords(it)
    if (schemaCxtHasRules(it)) {
      topSchemaObjCode(it)
      return
    }
  }
  validateFunction(it, () => topBoolOrEmptySchema(it))
}

function validateFunction(
  {gen, validateName, schema, schemaEnv, opts}: SchemaCxt,
  body: Block
): void {
  if (opts.code.es5) {
    gen.func(validateName, _`${N.data}, ${N.valCxt}`, schemaEnv.$async, () => {
      gen.code(_`"use strict"; ${funcSourceUrl(schema, opts)}`)
      destructureValCxtES5(gen, opts)
      gen.code(body)
    })
  } else {
    gen.func(validateName, _`${N.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () =>
      gen.code(funcSourceUrl(schema, opts)).code(body)
    )
  }
}

function destructureValCxt(opts: InstanceOptions): Code {
  return _`{${N.dataPath}="", ${N.parentData}, ${N.parentDataProperty}, ${N.rootData}=${N.data}${
    opts.dynamicRef ? _`, ${N.dynamicAnchors}={}` : nil
  }}={}`
}

function destructureValCxtES5(gen: CodeGen, opts: InstanceOptions): void {
  gen.if(
    N.valCxt,
    () => {
      gen.var(N.dataPath, _`${N.valCxt}.${N.dataPath}`)
      gen.var(N.parentData, _`${N.valCxt}.${N.parentData}`)
      gen.var(N.parentDataProperty, _`${N.valCxt}.${N.parentDataProperty}`)
      gen.var(N.rootData, _`${N.valCxt}.${N.rootData}`)
      if (opts.dynamicRef) gen.var(N.dynamicAnchors, _`${N.valCxt}.${N.dynamicAnchors}`)
    },
    () => {
      gen.var(N.dataPath, _`""`)
      gen.var(N.parentData, _`undefined`)
      gen.var(N.parentDataProperty, _`undefined`)
      gen.var(N.rootData, N.data)
      if (opts.dynamicRef) gen.var(N.dynamicAnchors, _`{}`)
    }
  )
}

function topSchemaObjCode(it: SchemaObjCxt): void {
  const {schema, opts, gen} = it
  validateFunction(it, () => {
    if (opts.$comment && schema.$comment) commentKeyword(it)
    checkNoDefault(it)
    gen.let(N.vErrors, null)
    gen.let(N.errors, 0)
    if (opts.unevaluated) resetEvaluated(it)
    typeAndKeywords(it)
    returnResults(it)
  })
  return
}

function resetEvaluated(it: SchemaObjCxt): void {
  // TODO maybe some hook to execute it in the end to check whether props/items are Name, as in assignEvaluated
  const {gen, validateName} = it
  it.evaluated = gen.const("evaluated", _`${validateName}.evaluated`)
  gen.if(_`${it.evaluated}.dynamicProps`, () => gen.assign(_`${it.evaluated}.props`, _`undefined`))
  gen.if(_`${it.evaluated}.dynamicItems`, () => gen.assign(_`${it.evaluated}.items`, _`undefined`))
}

function funcSourceUrl(schema: AnySchema, opts: InstanceOptions): Code {
  return typeof schema == "object" && schema.$id && (opts.code.source || opts.code.process)
    ? _`/*# sourceURL=${schema.$id} */`
    : nil
}

// schema compilation - this function is used recursively to generate code for sub-schemas
export function subschemaCode(it: SchemaCxt, valid: Name): void {
  if (isSchemaObj(it)) {
    checkKeywords(it)
    if (schemaCxtHasRules(it)) {
      subSchemaObjCode(it, valid)
      return
    }
  }
  boolOrEmptySchema(it, valid)
}

export function schemaCxtHasRules({schema, self}: SchemaCxt): boolean {
  if (typeof schema == "boolean") return !schema
  for (const key in schema) if (self.RULES.all[key]) return true
  return false
}

function isSchemaObj(it: SchemaCxt): it is SchemaObjCxt {
  return typeof it.schema != "boolean"
}

function subSchemaObjCode(it: SchemaObjCxt, valid: Name): void {
  const {schema, gen, opts} = it
  if (opts.$comment && schema.$comment) commentKeyword(it)
  updateContext(it)
  checkAsync(it)
  const errsCount = gen.const("_errs", N.errors)
  typeAndKeywords(it, errsCount)
  // TODO var
  gen.var(valid, _`${errsCount} === ${N.errors}`)
}

function checkKeywords(it: SchemaObjCxt): void {
  checkUnknownRules(it)
  checkRefsAndKeywords(it)
}

function typeAndKeywords(it: SchemaObjCxt, errsCount?: Name): void {
  if (it.opts.jtd) return schemaKeywords(it, [], false, errsCount)
  const types = getSchemaTypes(it.schema)
  const checkedTypes = coerceAndCheckDataType(it, types)
  schemaKeywords(it, types, !checkedTypes, errsCount)
}

function checkRefsAndKeywords(it: SchemaObjCxt): void {
  const {schema, errSchemaPath, opts, self} = it
  if (schema.$ref && opts.ignoreKeywordsWithRef && schemaHasRulesButRef(schema, self.RULES)) {
    self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`)
  }
}

function checkNoDefault(it: SchemaObjCxt): void {
  const {schema, opts} = it
  if (schema.default !== undefined && opts.useDefaults && opts.strict) {
    checkStrictMode(it, "default is ignored in the schema root")
  }
}

function updateContext(it: SchemaObjCxt): void {
  if (it.schema.$id) it.baseId = resolveUrl(it.baseId, it.schema.$id)
}

function checkAsync(it: SchemaObjCxt): void {
  if (it.schema.$async && !it.schemaEnv.$async) throw new Error("async schema in sync schema")
}

function commentKeyword({gen, schemaEnv, schema, errSchemaPath, opts}: SchemaObjCxt): void {
  const msg = schema.$comment
  if (opts.$comment === true) {
    gen.code(_`${N.self}.logger.log(${msg})`)
  } else if (typeof opts.$comment == "function") {
    const schemaPath = str`${errSchemaPath}/$comment`
    const rootName = gen.scopeValue("root", {ref: schemaEnv.root})
    gen.code(_`${N.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`)
  }
}

function returnResults(it: SchemaCxt): void {
  const {gen, schemaEnv, validateName, ValidationError, opts} = it
  if (schemaEnv.$async) {
    // TODO assign unevaluated
    gen.if(
      _`${N.errors} === 0`,
      () => gen.return(N.data),
      () => gen.throw(_`new ${ValidationError as Name}(${N.vErrors})`)
    )
  } else {
    gen.assign(_`${validateName}.errors`, N.vErrors)
    if (opts.unevaluated) assignEvaluated(it)
    gen.return(_`${N.errors} === 0`)
  }
}

function assignEvaluated({gen, evaluated, props, items}: SchemaCxt): void {
  if (props instanceof Name) gen.assign(_`${evaluated}.props`, props)
  if (items instanceof Name) gen.assign(_`${evaluated}.items`, items)
}

export function checkStrictMode(it: SchemaCxt, msg: string, mode = it.opts.strict): void {
  if (!mode) return
  msg = `strict mode: ${msg}`
  if (mode === true) throw new Error(msg)
  it.self.logger.warn(msg)
}
