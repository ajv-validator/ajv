import {
  KeywordDefinition,
  KeywordErrorCtx,
  KeywordCtxParams,
  SchemaObjCtx,
  SchemaObject,
} from "../types"
import {schemaRefOrVal} from "../vocabularies/util"
import {getData, checkDataTypes, DataType} from "./util"
import {
  reportError,
  reportExtraError,
  resetErrorsCount,
  keywordError,
  keyword$DataError,
} from "./errors"
import {CodeGen, _, nil, or, Code, Name} from "./codegen"
import N from "./names"

export default class KeywordCtx implements KeywordErrorCtx {
  gen: CodeGen
  allErrors: boolean
  keyword: string
  data: Name
  $data?: string | false
  schema: any
  schemaValue: Code | number | boolean // Code reference to keyword schema value or primitive value
  schemaCode: Code | number | boolean // Code reference to resolved schema value (different if schema is $data)
  schemaType?: string | string[]
  parentSchema: SchemaObject
  errsCount?: Name
  params: KeywordCtxParams
  it: SchemaObjCtx
  def: KeywordDefinition

  constructor(it: SchemaObjCtx, def: KeywordDefinition, keyword: string) {
    validateKeywordUsage(it, def, keyword)
    this.gen = it.gen
    this.allErrors = it.allErrors
    this.keyword = keyword
    this.data = it.data
    this.schema = it.schema[keyword]
    this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data
    this.schemaValue = schemaRefOrVal(it, this.schema, keyword, this.$data)
    this.schemaType = def.schemaType
    this.parentSchema = it.schema
    this.params = {}
    this.it = it
    this.def = def

    if (this.$data) {
      this.schemaCode = it.gen.const("schema", getData(this.$data, it))
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

  result(condition: Code, successAction?: () => void, failAction?: () => void): void {
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

  pass(condition: Code, failAction?: () => void): void {
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

  fail$data(condition: Code): void {
    if (!this.$data) return this.fail(condition)
    const {schemaCode} = this
    this.fail(_`${schemaCode} !== undefined && (${or(this.invalid$data(), condition)})`)
  }

  error(append?: true): void {
    ;(append ? reportExtraError : reportError)(this, this.def.error || keywordError)
  }

  $dataError(): void {
    reportError(this, this.def.$dataError || keyword$DataError)
  }

  reset(): void {
    if (this.errsCount === undefined) throw new Error('add "trackErrors" to keyword definition')
    resetErrorsCount(this.gen, this.errsCount)
  }

  ok(cond: Code | boolean): void {
    if (!this.allErrors) this.gen.if(cond)
  }

  setParams(obj: KeywordCtxParams, assign?: true): void {
    if (assign) Object.assign(this.params, obj)
    else this.params = obj
  }

  block$data(valid: Name = nil, codeBlock: () => void, $dataValid: Code = nil): void {
    this.gen.block(() => {
      this.check$data(valid, $dataValid)
      codeBlock()
    })
  }

  check$data(valid: Name = nil, $dataValid: Code = nil): void {
    if (!this.$data) return
    const {gen, schemaCode, schemaType, def} = this
    gen.if(or(_`${schemaCode} === undefined`, $dataValid))
    if (valid !== nil) gen.assign(valid, true)
    if (schemaType || def.validateSchema) {
      gen.elseIf(this.invalid$data())
      this.$dataError()
      if (valid !== nil) gen.assign(valid, false)
    }
    gen.else()
  }

  invalid$data(): Code {
    const {gen, schemaCode, schemaType, def, it} = this
    return or(wrong$DataType(), invalid$DataSchema())

    function wrong$DataType(): Code {
      if (schemaType) {
        if (!(schemaCode instanceof Name)) throw new Error("ajv implementation error")
        const st = Array.isArray(schemaType) ? schemaType : [schemaType]
        return _`(${checkDataTypes(st, schemaCode, it.opts.strict, DataType.Wrong)})`
      }
      return nil
    }

    function invalid$DataSchema(): Code {
      if (def.validateSchema) {
        const validateSchemaRef = gen.value("validate$data", {ref: def.validateSchema}) // TODO value.code
        return _`!${validateSchemaRef}(${schemaCode})`
      }
      return nil
    }
  }
}

function validSchemaType(schema: unknown, schemaType: string | string[]): boolean {
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

function validateKeywordUsage(it: SchemaObjCtx, def: KeywordDefinition, keyword: string): void {
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
