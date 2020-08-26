import {KeywordContext, KeywordErrorDefinition} from "../types"
import {quotedString} from "../vocabularies/util"
import CodeGen, {Name} from "./codegen"

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
  gen.code(`errors = ${errsCount};`)
  gen.if(`vErrors !== null`, () =>
    gen.if(errsCount, `vErrors.length = ${errsCount}`, "vErrors = null")
  )
}

export function extendErrors(
  {gen, keyword, schemaValue, data, it}: KeywordContext,
  errsCount: Name
): void {
  gen.for(`let i=${errsCount}; i<errors; i++`, () => {
    gen.code(`const err = vErrors[i];`)
    gen.if("err.dataPath === undefined", `err.dataPath = (dataPath || '') + ${it.errorPath}`)
    gen.code(`err.schemaPath = ${quotedString(it.errSchemaPath + "/" + keyword)};`)
    if (it.opts.verbose) {
      gen.code(
        `err.schema = ${schemaValue};
        err.data = ${data};`
      )
    }
  })
}

function addError(gen: CodeGen, errObj: string): void {
  const err = gen.name("err")
  gen
    .code(`const ${err} = ${errObj};`)
    .if("vErrors === null", `vErrors = [${err}]`, `vErrors.push(${err})`)
    .code(`errors++;`)
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
