import {CompilationContext} from "../../types"
import {schemaUnknownRules, schemaHasRules, schemaHasRulesExcept} from "../util"
import {quotedString} from "../../vocabularies/util"
import {booleanOrEmptySchema} from "./boolSchema"
import {getSchemaTypes, coerceAndCheckDataType} from "./dataType"
import {schemaKeywords} from "./keywords"

const resolve = require("../resolve")

// schema compilation (render) time:
// it = { schema, RULES, _validate, opts }
// it.validate - this function (validateCode),
//   it is used recursively to generate code for sub-schemas
//
// runtime:
// "validate" is a variable name to which this function will be assigned
// validateRef etc. are defined in the parent scope in index.js
export default function validateCode(
  it: CompilationContext,
  valid?: string,
  appendGen?: true // TODO remove once all callers pass true
): string | void {
  const {
    isTop,
    schema,
    RULES,
    level,
    gen,
    opts: {$comment},
  } = it

  let _out
  if (!appendGen) {
    // TODO _out
    _out = gen._out
    gen._out = ""
  }

  // TODO valid must be non-optional or maybe it must be returned
  if (!valid) valid = `valid${level}`

  checkUnknownKeywords(it)
  checkRefsAndKeywords(it)

  if (isTop) startFunction(it)
  if (booleanOrEmpty()) return _out
  if ($comment && schema.$comment) commentKeyword(it)

  if (isTop) {
    updateTopContext(it)
    checkNoDefault(it)
    initializeTop(it)
    typeAndKeywords()
    endFunction(it)
  } else {
    updateContext(it)
    checkAsync(it)
    // TODO level, var - it is coupled with errs count in keyword.ts
    gen.code(`var errs_${level} = errors;`)
    typeAndKeywords()
    // TODO level, var
    gen.code(`var ${valid} = errors === errs_${level};`)
  }

  if (!appendGen) {
    // TODO _out
    ;[_out, gen._out] = [gen._out, _out]
    return _out
  }

  function booleanOrEmpty(): true | void {
    if (typeof schema == "boolean" || !schemaHasRules(schema, RULES.all)) {
      // TODO remove type cast once valid is non optional
      booleanOrEmptySchema(it, <string>valid)

      if (!appendGen) {
        // TODO _out
        ;[_out, gen._out] = [gen._out, _out]
      }
      return true
    }
  }

  function typeAndKeywords(): void {
    const types = getSchemaTypes(it)
    const checkedTypes = coerceAndCheckDataType(it, types)
    schemaKeywords(it, types, !checkedTypes, isTop)
  }
}

function checkUnknownKeywords({
  schema,
  RULES,
  opts: {strictKeywords},
  logger,
}: CompilationContext): void {
  if (strictKeywords) {
    const unknownKeyword = schemaUnknownRules(schema, RULES.keywords)
    if (unknownKeyword) {
      const msg = `unknown keyword: "${unknownKeyword}"`
      if (strictKeywords === "log") logger.warn(msg)
      else throw new Error(msg)
    }
  }
}

function checkRefsAndKeywords({
  schema,
  errSchemaPath,
  RULES,
  opts: {extendRefs},
  logger,
}: CompilationContext): void {
  if (schema.$ref && schemaHasRulesExcept(schema, RULES.all, "$ref")) {
    if (extendRefs === "fail") {
      throw new Error(`$ref: sibling validation keywords at "${errSchemaPath}" (option extendRefs)`)
    } else if (extendRefs !== true) {
      logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`)
    }
  }
}

function startFunction({
  gen,
  schema,
  async,
  opts: {sourceCode, processCode},
}: CompilationContext): void {
  const asyncFunc = async ? "async" : ""
  const sourceUrl =
    schema.$id && (sourceCode || processCode) ? `/*# sourceURL=${schema.$id as string} */` : ""
  gen.code(
    `const validate = ${asyncFunc} function(data, dataPath, parentData, parentDataProperty, rootData) {
      'use strict';
      ${sourceUrl}`
  )
}

function updateTopContext(it: CompilationContext): void {
  // it.rootId = resolve.fullPath(it.root.schema.$id)
  // it.baseId = it.baseId || it.rootId
  delete it.isTop
}

function checkNoDefault({
  schema,
  opts: {useDefaults, strictDefaults},
  logger,
}: CompilationContext): void {
  if (schema.default !== undefined && useDefaults && strictDefaults) {
    const msg = "default is ignored in the schema root"
    if (strictDefaults === "log") logger.warn(msg)
    else throw new Error(msg)
  }
}

function initializeTop({gen}: CompilationContext): void {
  // TODO old comment: "don't edit, used in replace". Should be removed?
  gen.code(
    `let vErrors = null;
    let errors = 0;
    if (rootData === undefined) rootData = data;`
  )
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

function endFunction({gen, async}: CompilationContext) {
  // TODO old comment: "don't edit, used in replace". Should be removed?
  gen.code(
    async
      ? `if (errors === 0) return data;
        else throw new ValidationError(vErrors);`
      : `validate.errors = vErrors;
        return errors === 0;`
  )
  gen.code(
    `};
    return validate;`
  )
}
