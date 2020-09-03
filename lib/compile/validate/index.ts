import {CompilationContext, Options} from "../../types"
import {schemaUnknownRules, schemaHasRules, schemaHasRulesExcept} from "../util"
import {topBoolOrEmptySchema, boolOrEmptySchema} from "./boolSchema"
import {getSchemaTypes, coerceAndCheckDataType} from "./dataType"
import {schemaKeywords} from "./iterate"
import CodeGen, {_, str, nil, Block, Code, Name} from "../codegen"
import N from "../names"

const resolve = require("../resolve")

// schema compilation - generates validation function, subschemaCode (below) is used for subschemas
export function validateFunctionCode(it: CompilationContext): void {
  const {schema, opts} = it
  checkKeywords(it)
  if (isBoolOrEmpty(it)) {
    validateFunction(it, () => topBoolOrEmptySchema(it))
    return
  }
  validateFunction(it, () => {
    if (opts.$comment && schema.$comment) commentKeyword(it)
    checkNoDefault(it)
    initializeTop(it.gen)
    typeAndKeywords(it)
    returnResults(it)
  })
}

function validateFunction({gen, schema, async, opts}: CompilationContext, body: Block) {
  gen.return(() =>
    gen.func(
      N.validate,
      _`${N.data}, ${N.dataPath}, ${N.parentData}, ${N.parentDataProperty}, ${N.rootData}`,
      async,
      () => gen.code(_`"use strict"; ${funcSourceUrl(schema, opts)}`).code(body)
    )
  )
}

function funcSourceUrl(schema, opts: Options): Code {
  return schema.$id && (opts.sourceCode || opts.processCode)
    ? _`/*# sourceURL=${schema.$id as string} */`
    : nil
}

// schema compilation - this function is used recursively to generate code for sub-schemas
export function subschemaCode(it: CompilationContext, valid: Name): void {
  const {schema, gen, opts} = it
  checkKeywords(it)
  if (isBoolOrEmpty(it)) {
    boolOrEmptySchema(it, valid)
    return
  }
  if (opts.$comment && schema.$comment) commentKeyword(it)
  updateContext(it)
  checkAsync(it)
  // TODO var - async validation fails if var replaced, possibly because of nodent
  const errsCount = gen.var("_errs", N.errors)
  typeAndKeywords(it, errsCount)
  // TODO var
  gen.var(valid, _`${errsCount} === ${N.errors}`)
}

function checkKeywords(it: CompilationContext) {
  checkUnknownKeywords(it)
  checkRefsAndKeywords(it)
}

function isBoolOrEmpty({schema, RULES}: CompilationContext): boolean {
  return typeof schema == "boolean" || !schemaHasRules(schema, RULES.all)
}

function typeAndKeywords(it: CompilationContext, errsCount?: Name): void {
  const types = getSchemaTypes(it, it.schema)
  const checkedTypes = coerceAndCheckDataType(it, types)
  schemaKeywords(it, types, !checkedTypes, errsCount)
}

function checkUnknownKeywords({schema, RULES, opts, logger}: CompilationContext): void {
  if (opts.strict) {
    const unknownKeyword = schemaUnknownRules(schema, RULES.keywords)
    if (unknownKeyword) {
      const msg = `unknown keyword: "${unknownKeyword}"`
      if (opts.strict === "log") logger.error(msg)
      else throw new Error(msg)
    }
  }
}

function checkRefsAndKeywords({
  schema,
  errSchemaPath,
  RULES,
  opts,
  logger,
}: CompilationContext): void {
  if (schema.$ref && schemaHasRulesExcept(schema, RULES.all, "$ref")) {
    if (opts.extendRefs === "fail") {
      throw new Error(`$ref: sibling validation keywords at "${errSchemaPath}" (option extendRefs)`)
    } else if (opts.extendRefs !== true) {
      logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`)
    }
  }
}

function checkNoDefault({schema, opts, logger}: CompilationContext): void {
  if (schema.default !== undefined && opts.useDefaults && opts.strict) {
    const msg = "default is ignored in the schema root"
    if (opts.strict === "log") logger.warn(msg)
    else throw new Error(msg)
  }
}

function initializeTop(gen: CodeGen): void {
  gen.let(N.vErrors, null)
  gen.let(N.errors, 0)
  gen.if(_`${N.rootData} === undefined`, () => gen.assign(N.rootData, N.data))
  // gen.if(_`${N.dataPath} === undefined`, () => gen.assign(N.dataPath, _`""`)) // TODO maybe add it
}

function updateContext(it: CompilationContext): void {
  if (it.schema.$id) it.baseId = resolve.url(it.baseId, it.schema.$id)
}

function checkAsync(it: CompilationContext): void {
  if (it.schema.$async && !it.async) throw new Error("async schema in sync schema")
}

function commentKeyword({gen, schema, errSchemaPath, opts: {$comment}}: CompilationContext): void {
  const msg = schema.$comment
  if ($comment === true) {
    gen.code(_`console.log(${msg})`) // should it use logger?
  } else if (typeof $comment == "function") {
    const schemaPath = str`${errSchemaPath}/$comment`
    gen.code(_`${N.self}._opts.$comment(${msg}, ${schemaPath}, ${N.validate}.root.schema)`)
  }
}

function returnResults({gen, async}: CompilationContext) {
  if (async) {
    gen.if(
      _`${N.errors} === 0`,
      () => gen.return(N.data),
      _`throw new ValidationError(${N.vErrors})`
    )
  } else {
    gen.assign(_`${N.validate}.errors`, N.vErrors)
    gen.return(_`${N.errors} === 0`)
  }
}
