import {
  KeywordDefinition,
  KeywordErrorContext,
  KeywordContextParams,
  CompilationContext,
} from "../types"
import {schemaRefOrVal} from "../vocabularies/util"
import {getData} from "./util"
import {reportError, reportExtraError, resetErrorsCount, keywordError} from "./errors"
import CodeGen, {Code, Name, Expression} from "./codegen"
import N from "./names"

export default class KeywordContext implements KeywordErrorContext {
  gen: CodeGen
  allErrors: boolean
  keyword: string
  data: Name
  $data?: string | false
  schema: any
  schemaValue: Code | number | boolean // Code reference to keyword schema value or primitive value
  schemaCode: Code | number | boolean // Code reference to resolved schema value (different if schema is $data)
  parentSchema: any
  errsCount?: Name
  params: KeywordContextParams
  it: CompilationContext
  def: KeywordDefinition

  constructor(it: CompilationContext, def: KeywordDefinition, keyword: string) {
    validateKeywordUsage(it, def, keyword)
    this.gen = it.gen
    this.allErrors = it.allErrors
    this.keyword = keyword
    this.data = it.data
    this.schema = it.schema[keyword]
    this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data
    this.schemaValue = schemaRefOrVal(it, this.schema, keyword, this.$data)
    this.parentSchema = it.schema
    this.params = {}
    this.it = it
    this.def = def

    if (this.$data) {
      this.schemaCode = it.gen.name("schema")
      it.gen.const(this.schemaCode, getData(this.$data, it))
    } else {
      this.schemaCode = this.schemaValue
      if (def.schemaType && !validSchemaType(this.schema, def.schemaType)) {
        throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`)
      }
    }

    if ("code" in def ? def.trackErrors : def.errors !== false) {
      this.errsCount = it.gen.const("_errs", N.errors)
    }
  }

  result(condition: Expression, successAction?: () => void, failAction?: () => void): void {
    this.gen.ifNot(condition)
    failAction ? failAction() : this.error()
    if (successAction) {
      this.gen.else()
      successAction()
      if (this.allErrors) this.gen.endIf()
    } else {
      if (this.allErrors) this.gen.endIf()
      else this.gen.else()
    }
  }

  pass(condition: Expression, failAction?: () => void): void {
    this.result(condition, undefined, failAction)
  }

  fail(condition?: Code): void {
    if (condition === undefined) {
      this.error()
      if (!this.allErrors) this.gen.if(false) // TODO some other way to disable branch?
      return
    }
    this.gen.if(condition)
    this.error()
    if (this.allErrors) this.gen.endIf()
    else this.gen.else()
  }

  error(append?: true): void {
    ;(append ? reportExtraError : reportError)(this, this.def.error || keywordError)
  }

  $dataError(): void {
    reportError(this, this.def.$dataError || this.def.error || keywordError)
  }

  reset(): void {
    if (this.errsCount === undefined) throw new Error('add "trackErrors" to keyword definition')
    resetErrorsCount(this.gen, this.errsCount)
  }

  ok(cond: Code | boolean): void {
    if (!this.allErrors) this.gen.if(cond)
  }

  setParams(obj: KeywordContextParams, assign?: true): void {
    if (assign) Object.assign(this.params, obj)
    else this.params = obj
  }
}

function validSchemaType(schema: any, schemaType: string | string[]): boolean {
  // TODO add tests
  if (Array.isArray(schemaType)) {
    return schemaType.some((st) => validSchemaType(schema, st))
  }
  return schemaType === "array"
    ? Array.isArray(schema)
    : schemaType === "object"
    ? schema && typeof schema == "object" && !Array.isArray(schema)
    : typeof schema == schemaType
}

function validateKeywordUsage(
  it: CompilationContext,
  def: KeywordDefinition,
  keyword: string
): void {
  if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
    throw new Error("ajv implementation error")
  }

  const deps = def.dependencies
  if (deps?.some((kwd) => !Object.prototype.hasOwnProperty.call(it.schema, kwd))) {
    throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`)
  }

  if (def.validateSchema) {
    const valid = def.validateSchema(it.schema[keyword])
    if (!valid) {
      const msg = "keyword value is invalid: " + it.self.errorsText(def.validateSchema.errors)
      if (it.opts.validateSchema === "log") it.logger.error(msg)
      else throw new Error(msg)
    }
  }
}
