import type {KeywordErrorCxt, KeywordErrorDefinition} from "../types"
import type {SchemaCxt} from "./index"
import {CodeGen, _, str, strConcat, Code, Name} from "./codegen"
import {SafeExpr} from "./codegen/code"
import N from "./names"

export const keywordError: KeywordErrorDefinition = {
  message: ({keyword}) => str`should pass "${keyword}" keyword validation`,
}

export const keyword$DataError: KeywordErrorDefinition = {
  message: ({keyword, schemaType}) =>
    schemaType
      ? str`"${keyword}" keyword must be ${schemaType} ($data)`
      : str`"${keyword}" keyword is invalid ($data)`,
}

export function reportError(
  cxt: KeywordErrorCxt,
  error: KeywordErrorDefinition,
  overrideAllErrors?: boolean
): void {
  const {it} = cxt
  const {gen, compositeRule, allErrors} = it
  const errObj = errorObjectCode(cxt, error)
  if (overrideAllErrors ?? (compositeRule || allErrors)) {
    addError(gen, errObj)
  } else {
    returnErrors(it, _`[${errObj}]`)
  }
}

export function reportExtraError(cxt: KeywordErrorCxt, error: KeywordErrorDefinition): void {
  const {it} = cxt
  const {gen, compositeRule, allErrors} = it
  const errObj = errorObjectCode(cxt, error)
  addError(gen, errObj)
  if (!(compositeRule || allErrors)) {
    returnErrors(it, N.vErrors)
  }
}

export function resetErrorsCount(gen: CodeGen, errsCount: Name): void {
  gen.assign(N.errors, errsCount)
  gen.if(_`${N.vErrors} !== null`, () =>
    gen.if(
      errsCount,
      () => gen.assign(_`${N.vErrors}.length`, errsCount),
      () => gen.assign(N.vErrors, null)
    )
  )
}

export function extendErrors({
  gen,
  keyword,
  schemaValue,
  data,
  errsCount,
  it,
}: KeywordErrorCxt): void {
  /* istanbul ignore if */
  if (errsCount === undefined) throw new Error("ajv implementation error")
  const err = gen.name("err")
  gen.forRange("i", errsCount, N.errors, (i) => {
    gen.const(err, _`${N.vErrors}[${i}]`)
    gen.if(_`${err}.dataPath === undefined`, () =>
      gen.assign(_`${err}.dataPath`, strConcat(N.dataPath, it.errorPath))
    )
    gen.assign(_`${err}.schemaPath`, str`${it.errSchemaPath}/${keyword}`)
    if (it.opts.verbose) {
      gen.assign(_`${err}.schema`, schemaValue)
      gen.assign(_`${err}.data`, data)
    }
  })
}

function addError(gen: CodeGen, errObj: Code): void {
  const err = gen.const("err", errObj)
  gen.if(
    _`${N.vErrors} === null`,
    () => gen.assign(N.vErrors, _`[${err}]`),
    _`${N.vErrors}.push(${err})`
  )
  gen.code(_`${N.errors}++`)
}

function returnErrors(it: SchemaCxt, errs: Code): void {
  const {gen, validateName, schemaEnv} = it
  if (schemaEnv.$async) {
    gen.throw(_`new ${it.ValidationError as Name}(${errs})`)
  } else {
    gen.assign(_`${validateName}.errors`, errs)
    gen.return(false)
  }
}

const E = {
  keyword: new Name("keyword"),
  schemaPath: new Name("schemaPath"),
  params: new Name("params"),
  propertyName: new Name("propertyName"),
  message: new Name("message"),
  schema: new Name("schema"),
  parentSchema: new Name("parentSchema"),
}

function errorObjectCode(cxt: KeywordErrorCxt, error: KeywordErrorDefinition): Code {
  const {
    keyword,
    data,
    schemaValue,
    it: {gen, createErrors, topSchemaRef, schemaPath, errorPath, errSchemaPath, propertyName, opts},
  } = cxt
  if (createErrors === false) return _`{}`
  const {params, message} = error
  const keyValues: [Name, SafeExpr | string][] = [
    [E.keyword, keyword],
    [N.dataPath, strConcat(N.dataPath, errorPath)],
    [E.schemaPath, str`${errSchemaPath}/${keyword}`],
    [E.params, typeof params == "function" ? params(cxt) : params || _`{}`],
  ]
  if (propertyName) keyValues.push([E.propertyName, propertyName])
  if (opts.messages !== false) {
    const msg = typeof message == "function" ? message(cxt) : message
    keyValues.push([E.message, msg])
  }
  if (opts.verbose) {
    keyValues.push(
      [E.schema, schemaValue],
      [E.parentSchema, _`${topSchemaRef}${schemaPath}`],
      [N.data, data]
    )
  }
  return gen.object(...keyValues)
}
