import type {KeywordErrorCxt, KeywordErrorDefinition, SchemaCxt} from "../types"
import {CodeGen, _, str, Code, Name} from "./codegen"
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
    gen.if(errsCount, _`${N.vErrors}.length = ${errsCount}`, _`${N.vErrors} = null`)
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
  if (errsCount === undefined) throw new Error("ajv implementation error")
  const err = gen.name("err")
  gen.forRange("i", errsCount, N.errors, (i) => {
    gen.const(err, _`${N.vErrors}[${i}]`)
    gen.if(
      _`${err}.dataPath === undefined`,
      _`${err}.dataPath = (${N.dataPath} || '') + ${it.errorPath}`
    )
    gen.code(_`${err}.schemaPath = ${str`${it.errSchemaPath}/${keyword}`}`)
    if (it.opts.verbose) {
      gen.code(_`${err}.schema = ${schemaValue}; ${err}.data = ${data}`)
    }
  })
}

function addError(gen: CodeGen, errObj: Code): void {
  const err = gen.const("err", errObj)
  gen.if(_`${N.vErrors} === null`, _`${N.vErrors} = [${err}]`, _`${N.vErrors}.push(${err})`)
  gen.code(_`${N.errors}++`)
}

function returnErrors(it: SchemaCxt, errs: Code): void {
  const {gen, validateName, schemaEnv} = it
  if (schemaEnv.$async) {
    gen.code(_`throw new ${it.ValidationError as Name}(${errs})`)
  } else {
    gen.assign(_`${validateName}.errors`, errs)
    gen.return(false)
  }
}

function errorObjectCode(cxt: KeywordErrorCxt, error: KeywordErrorDefinition): Code {
  const {
    keyword,
    data,
    schemaValue,
    it: {createErrors, topSchemaRef, schemaPath, errorPath, errSchemaPath, propertyName, opts},
  } = cxt
  if (createErrors === false) return _`{}`
  const {params, message} = error
  const msg = typeof message == "string" ? message : message(cxt)
  const par = params ? params(cxt) : _`{}`
  const out = _`{keyword: ${keyword}, dataPath: (${N.dataPath} || "") + ${errorPath}`
  out.add(_`, schemaPath: ${str`${errSchemaPath}/${keyword}`}, params: ${par}`)
  if (propertyName) {
    out.add(_`, propertyName: ${propertyName}`)
  }
  if (opts.messages !== false) {
    out.add(_`, message: ${msg}`)
  }
  if (opts.verbose) {
    out.add(_`, schema: ${schemaValue}, parentSchema: ${topSchemaRef}${schemaPath}, data: ${data}`)
  }
  out.add(_`}`)
  return out
}
