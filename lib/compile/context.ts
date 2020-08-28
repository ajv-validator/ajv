import {
  KeywordDefinition,
  KeywordErrorContext,
  KeywordContextParams,
  CompilationContext,
} from "../types"
import {schemaRefOrVal} from "../vocabularies/util"
import {getData} from "./util"
import {reportError, keywordError} from "./errors"
import CodeGen, {_, Name, Expression} from "./codegen"

export default class KeywordContext implements KeywordErrorContext {
  gen: CodeGen
  allErrors: boolean
  keyword: string
  data: Name
  $data?: string | false
  schema: any
  schemaValue: Expression | number | boolean // Code reference to keyword schema value or primitive value
  schemaCode: Expression | number | boolean // Code reference to resolved schema value (different if schema is $data)
  parentSchema: any
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
      it.gen.const(this.schemaCode, `${getData(this.$data, it)}`)
    } else {
      this.schemaCode = this.schemaValue
      if (def.schemaType && !validSchemaType(this.schema, def.schemaType)) {
        throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`)
      }
    }
  }

  result(condition: Expression, successAction?: () => void, failAction?: () => void): void {
    this.gen.ifNot(condition)
    this._actionOrError(failAction)
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

  fail(condition?: Expression): void {
    if (condition) {
      this.gen.if(condition)
      reportError(this, this.def.error || keywordError)
      if (this.allErrors) this.gen.endIf()
      else this.gen.else()
    } else {
      reportError(this, this.def.error || keywordError)
      if (!this.allErrors) this.gen.if(false) // TODO some other way to disable branch?
    }
  }

  _actionOrError(failAction?: () => void): void {
    failAction ? failAction() : reportError(this, this.def.error || keywordError)
  }

  ok(cond: Expression): void {
    if (!this.allErrors) this.gen.if(cond)
  }

  errorParams(obj: KeywordContextParams, assign?: true): void {
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
