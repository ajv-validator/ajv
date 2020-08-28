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
  schemaCode: Expression | number | boolean
  schemaValue: Expression | number | boolean
  parentSchema: any
  params: KeywordContextParams
  it: CompilationContext
  def: KeywordDefinition

  constructor(it: CompilationContext, keyword: string, def: KeywordDefinition) {
    const schema = it.schema[keyword]
    const {schemaType, $data: $defData} = def
    validateKeywordSchema(it, keyword, def)
    // TODO
    // if (!code) throw new Error('"code" and "error" must be defined')
    const $data = $defData && it.opts.$data && schema && schema.$data
    const schemaValue = schemaRefOrVal(it, schema, keyword, $data)
    this.gen = it.gen
    this.allErrors = it.allErrors
    this.keyword = keyword
    this.data = it.data
    this.$data = $data
    this.schema = schema
    this.schemaCode = $data ? it.gen.name("schema") : schemaValue // reference to resolved schema value
    this.schemaValue = schemaValue // actual schema reference or value for primitive values
    this.parentSchema = it.schema
    this.params = {}
    this.it = it
    this.def = def

    if ($data) {
      it.gen.const(<Name>this.schemaCode, `${getData($data, it)}`)
    } else if (schemaType && !validSchemaType(schema, schemaType)) {
      throw new Error(`${keyword} must be ${JSON.stringify(schemaType)}`)
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

  fail(condition?: Expression, failAction?: () => void): void {
    if (condition) {
      this.gen.if(condition)
      this._actionOrError(failAction)
      if (this.allErrors) this.gen.endIf()
      else this.gen.else()
    } else {
      this._actionOrError(failAction)
      if (!this.allErrors) this.gen.if("false") // TODO some other way to disable branch?
    }
  }

  _actionOrError(failAction?: () => void): void {
    failAction ? failAction() : reportError(this, this.def.error || keywordError)
  }

  ok(cond: Expression): void {
    if (!this.allErrors) this.gen.if(cond)
  }

  errorParams(obj: KeywordContextParams, assign?: true) {
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

function validateKeywordSchema(
  it: CompilationContext,
  keyword: string,
  def: KeywordDefinition
): void {
  const deps = def.dependencies
  if (deps?.some((kwd) => !Object.prototype.hasOwnProperty.call(it.schema, kwd))) {
    throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`)
  }

  if (def.validateSchema) {
    const valid = def.validateSchema(it.schema[keyword])
    if (!valid) {
      const msg = "keyword schema is invalid: " + it.self.errorsText(def.validateSchema.errors)
      if (it.opts.validateSchema === "log") it.logger.error(msg)
      else throw new Error(msg)
    }
  }
}
