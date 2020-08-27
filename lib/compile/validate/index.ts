import {CompilationContext} from "../../types"
import {schemaUnknownRules, schemaHasRules, schemaHasRulesExcept} from "../util"
import {quotedString} from "../../vocabularies/util"
import {topBoolOrEmptySchema, boolOrEmptySchema} from "./boolSchema"
import {getSchemaTypes, coerceAndCheckDataType} from "./dataType"
import {schemaKeywords} from "./iterate"
import CodeGen, {_, Block, Name} from "../codegen"
import names from "../names"

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

function validateFunction(it: CompilationContext, body: Block) {
  const {gen, data, parentData, parentDataProperty} = it
  gen.return(() =>
    gen.func(
      names.validate,
      _`${data}, ${names.dataPath}, ${parentData}, ${parentDataProperty}, ${names.rootData}`,
      it.async,
      () => gen.code(`"use strict"; ${funcSourceUrl(it)}`).code(body)
    )
  )
}

function funcSourceUrl({schema, opts}: CompilationContext): string {
  return schema.$id && (opts.sourceCode || opts.processCode)
    ? `/*# sourceURL=${schema.$id as string} */`
    : ""
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
  const errsCount = gen.var("_errs", "errors")
  typeAndKeywords(it, errsCount)
  // TODO var
  gen.var(valid, _`${errsCount} === errors`)
}

function checkKeywords(it: CompilationContext) {
  checkUnknownKeywords(it)
  checkRefsAndKeywords(it)
}

function isBoolOrEmpty({schema, RULES}: CompilationContext): boolean {
  return typeof schema == "boolean" || !schemaHasRules(schema, RULES.all)
}

function typeAndKeywords(it: CompilationContext, errsCount?: Name): void {
  const types = getSchemaTypes(it)
  const checkedTypes = coerceAndCheckDataType(it, types)
  schemaKeywords(it, types, !checkedTypes, errsCount)
}

function checkUnknownKeywords({schema, RULES, opts, logger}: CompilationContext): void {
  if (opts.strictKeywords) {
    const unknownKeyword = schemaUnknownRules(schema, RULES.keywords)
    if (unknownKeyword) {
      const msg = `unknown keyword: "${unknownKeyword}"`
      if (opts.strictKeywords === "log") logger.warn(msg)
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
  if (schema.default !== undefined && opts.useDefaults && opts.strictDefaults) {
    const msg = "default is ignored in the schema root"
    if (opts.strictDefaults === "log") logger.warn(msg)
    else throw new Error(msg)
  }
}

function initializeTop(gen: CodeGen): void {
  gen
    .code(
      `let vErrors = null;
       let errors = 0;`
    )
    .if(`rootData === undefined`, `rootData = data;`)
}

function updateContext(it: CompilationContext): void {
  if (it.schema.$id) it.baseId = resolve.url(it.baseId, it.schema.$id)
}

function checkAsync(it: CompilationContext): void {
  if (it.schema.$async && !it.async) throw new Error("async schema in sync schema")
}

function commentKeyword({gen, schema, errSchemaPath, opts: {$comment}}: CompilationContext): void {
  const msg = quotedString(schema.$comment)
  if ($comment === true) {
    gen.code(`console.log(${msg})`)
  } else if (typeof $comment == "function") {
    const schemaPath = quotedString(errSchemaPath + "/$comment")
    gen.code(`self._opts.$comment(${msg}, ${schemaPath}, validate.root.schema)`)
  }
}

function returnResults({gen, async}: CompilationContext) {
  if (async) {
    gen.if("errors === 0", "return data", "throw new ValidationError(vErrors)")
  } else {
    gen.code(
      `validate.errors = vErrors;
      return errors === 0;`
    )
  }
}
