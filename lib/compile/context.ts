import type {
  AddedKeywordDefinition,
  KeywordErrorCxt,
  KeywordCxtParams,
  AnySchemaObject,
} from "../types"
import {SchemaCxt, SchemaObjCxt} from "./index"
import {JSONType} from "./rules"
import {checkDataTypes, DataType} from "./validate/dataType"
import {schemaRefOrVal, unescapeJsonPointer, mergeEvaluated} from "./util"
import {
  reportError,
  reportExtraError,
  resetErrorsCount,
  keywordError,
  keyword$DataError,
} from "./errors"
import {CodeGen, _, nil, or, not, getProperty, Code, Name} from "./codegen"
import N from "./names"
import {applySubschema, SubschemaArgs} from "./subschema"

export default class KeywordCxt implements KeywordErrorCxt {
  readonly gen: CodeGen
  readonly allErrors?: boolean
  readonly keyword: string
  readonly data: Name // Name referencing the current level of the data instance
  readonly $data?: string | false
  readonly schema: any // keyword value in the schema
  readonly schemaValue: Code | number | boolean // Code reference to keyword schema value or primitive value
  readonly schemaCode: Code | number | boolean // Code reference to resolved schema value (different if schema is $data)
  readonly schemaType: JSONType[] // allowed type(s) of keyword value in the schema
  readonly parentSchema: AnySchemaObject
  readonly errsCount?: Name // Name reference to the number of validation errors collected before this keyword,
  // requires option trackErrors in keyword definition
  params: KeywordCxtParams // object to pass parameters to error messages from keyword code
  readonly it: SchemaObjCxt // schema compilation context (schema is guaranted to be an object, not boolean)
  readonly def: AddedKeywordDefinition

  constructor(it: SchemaObjCxt, def: AddedKeywordDefinition, keyword: string) {
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
      this.schemaCode = it.gen.const("vSchema", getData(this.$data, it))
    } else {
      this.schemaCode = this.schemaValue
      if (!validSchemaType(this.schema, def.schemaType, def.allowUndefined)) {
        throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`)
      }
    }

    if ("code" in def ? def.trackErrors : def.errors !== false) {
      this.errsCount = it.gen.const("_errs", N.errors)
    }
  }

  result(condition: Code, successAction?: () => void, failAction?: () => void): void {
    this.gen.if(not(condition))
    if (failAction) failAction()
    else this.error()
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
      if (!this.allErrors) this.gen.if(false) // this branch will be removed by gen.optimize
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

  setParams(obj: KeywordCxtParams, assign?: true): void {
    if (assign) Object.assign(this.params, obj)
    else this.params = obj
  }

  block$data(valid: Name, codeBlock: () => void, $dataValid: Code = nil): void {
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
    if (schemaType.length || def.validateSchema) {
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
      if (schemaType.length) {
        /* istanbul ignore if */
        if (!(schemaCode instanceof Name)) throw new Error("ajv implementation error")
        const st = Array.isArray(schemaType) ? schemaType : [schemaType]
        return _`${checkDataTypes(st, schemaCode, it.opts.strict, DataType.Wrong)}`
      }
      return nil
    }

    function invalid$DataSchema(): Code {
      if (def.validateSchema) {
        const validateSchemaRef = gen.scopeValue("validate$data", {ref: def.validateSchema}) // TODO value.code for standalone
        return _`!${validateSchemaRef}(${schemaCode})`
      }
      return nil
    }
  }

  subschema(appl: SubschemaArgs, valid: Name): SchemaCxt {
    return applySubschema(this.it, appl, valid)
  }

  mergeEvaluated(schemaCxt: SchemaCxt, toName?: typeof Name): void {
    const {it, gen} = this
    if (!it.opts.unevaluated) return
    if (it.props !== true && schemaCxt.props !== undefined) {
      it.props = mergeEvaluated.props(gen, schemaCxt.props, it.props, toName)
    }
    if (it.items !== true && schemaCxt.items !== undefined) {
      it.items = mergeEvaluated.items(gen, schemaCxt.items, it.items, toName)
    }
  }

  mergeValidEvaluated(schemaCxt: SchemaCxt, valid: Name): boolean | void {
    const {it, gen} = this
    if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
      gen.if(valid, () => this.mergeEvaluated(schemaCxt, Name))
      return true
    }
  }
}

function validSchemaType(schema: unknown, schemaType: JSONType[], allowUndefined = false): boolean {
  // TODO add tests
  return (
    !schemaType.length ||
    schemaType.some((st) =>
      st === "array"
        ? Array.isArray(schema)
        : st === "object"
        ? schema && typeof schema == "object" && !Array.isArray(schema)
        : typeof schema == st || (allowUndefined && typeof schema == "undefined")
    )
  )
}

function validateKeywordUsage(
  {schema, opts, self}: SchemaObjCxt,
  def: AddedKeywordDefinition,
  keyword: string
): void {
  /* istanbul ignore if */
  if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
    throw new Error("ajv implementation error")
  }

  const deps = def.dependencies
  if (deps?.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
    throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`)
  }

  if (def.validateSchema) {
    const valid = def.validateSchema(schema[keyword])
    if (!valid) {
      const msg = "keyword value is invalid: " + self.errorsText(def.validateSchema.errors)
      if (opts.validateSchema === "log") self.logger.error(msg)
      else throw new Error(msg)
    }
  }
}

const JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/
const RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/
export function getData(
  $data: string,
  {dataLevel, dataNames, dataPathArr}: SchemaCxt
): Code | number {
  let jsonPointer
  let data: Code
  if ($data === "") return N.rootData
  if ($data[0] === "/") {
    if (!JSON_POINTER.test($data)) throw new Error(`Invalid JSON-pointer: ${$data}`)
    jsonPointer = $data
    data = N.rootData
  } else {
    const matches = RELATIVE_JSON_POINTER.exec($data)
    if (!matches) throw new Error(`Invalid JSON-pointer: ${$data}`)
    const up: number = +matches[1]
    jsonPointer = matches[2]
    if (jsonPointer === "#") {
      if (up >= dataLevel) throw new Error(errorMsg("property/index", up))
      return dataPathArr[dataLevel - up]
    }
    if (up > dataLevel) throw new Error(errorMsg("data", up))
    data = dataNames[dataLevel - up]
    if (!jsonPointer) return data
  }

  let expr = data
  const segments = jsonPointer.split("/")
  for (const segment of segments) {
    if (segment) {
      data = _`${data}${getProperty(unescapeJsonPointer(segment))}`
      expr = _`${expr} && ${data}`
    }
  }
  return expr

  function errorMsg(pointerType: string, up: number): string {
    return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`
  }
}
