import {KeywordContext, KeywordErrorDefinition} from "../types"
import {quotedString} from "../vocabularies/util"
import CodeGen, {_, Name} from "./codegen"

export function reportError(
  cxt: KeywordContext,
  error: KeywordErrorDefinition,
  overrideAllErrors?: boolean
): void {
  const {gen, compositeRule, allErrors, async} = cxt.it
  const errObj = errorObjectCode(cxt, error)
  if (overrideAllErrors ?? (compositeRule || allErrors)) {
    addError(gen, errObj)
  } else {
    returnErrors(gen, async, `[${errObj}]`)
  }
}

export function reportExtraError(cxt: KeywordContext, error: KeywordErrorDefinition): void {
  const {gen, compositeRule, allErrors, async} = cxt.it
  const errObj = errorObjectCode(cxt, error)
  addError(gen, errObj)
  if (!(compositeRule || allErrors)) {
    returnErrors(gen, async, "vErrors")
  }
}

export function resetErrorsCount(gen: CodeGen, errsCount: Name): void {
  gen.code(_`errors = ${errsCount};`)
  gen.if(_`vErrors !== null`, () =>
    gen.if(errsCount, _`vErrors.length = ${errsCount}`, _`vErrors = null`)
  )
}

export function extendErrors(
  {gen, keyword, schemaValue, data, it}: KeywordContext,
  errsCount: Name
): void {
  const err = gen.name("err")
  gen.for(_`let i=${errsCount}; i<errors; i++`, () => {
    gen.const(err, _`vErrors[i]`)
    gen.if(_`${err}.dataPath === undefined`, `${err}.dataPath = (dataPath || '') + ${it.errorPath}`)
    gen.code(_`${err}.schemaPath = ${it.errSchemaPath + "/" + keyword};`)
    if (it.opts.verbose) {
      gen.code(
        `${err}.schema = ${schemaValue};
        ${err}.data = ${data};`
      )
    }
  })
}

function addError(gen: CodeGen, errObj: string): void {
  const err = gen.const("err", errObj)
  gen.if(_`vErrors === null`, _`vErrors = [${err}]`, _`vErrors.push(${err})`)
  gen.code(_`errors++;`)
}

function returnErrors(gen: CodeGen, async: boolean, errs: string): void {
  gen.code(
    async
      ? `throw new ValidationError(${errs});`
      : `validate.errors = ${errs};
        return false;`
  )
}

function errorObjectCode(cxt: KeywordContext, error: KeywordErrorDefinition): string {
  const {
    keyword,
    data,
    schemaValue,
    it: {createErrors, topSchemaRef, schemaPath, errorPath, errSchemaPath, propertyName, opts},
  } = cxt
  if (createErrors === false) return "{}"
  if (!error) throw new Error('keyword definition must have "error" property')
  const {params, message} = error
  // TODO trim whitespace
  let out = `{
    keyword: "${keyword}",
    dataPath: (dataPath || "") + ${errorPath},
    schemaPath: ${quotedString(errSchemaPath + "/" + keyword)},
    params: ${params ? params(cxt) : "{}"},`
  if (propertyName) out += `propertyName: ${propertyName},`
  if (opts.messages !== false) {
    out += `message: ${typeof message == "string" ? quotedString(message) : message(cxt)},`
  }
  if (opts.verbose) {
    // TODO trim whitespace
    out += `
      schema: ${schemaValue},
      parentSchema: ${topSchemaRef}${schemaPath},
      data: ${data},`
  }
  return out + "}"
}
