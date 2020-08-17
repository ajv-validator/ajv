import {KeywordContext, KeywordErrorDefinition} from "../types"
import {toQuotedString} from "./util"
import CodeGen from "./codegen"

export function reportError(
  cxt: KeywordContext,
  error: KeywordErrorDefinition,
  allErrors?: boolean
): void {
  const {gen, compositeRule, opts, async} = cxt.it
  const errObj = errorObjectCode(cxt, error)
  if (allErrors ?? (compositeRule || opts.allErrors)) {
    addError(gen, errObj)
  } else {
    returnErrors(gen, async, `[${errObj}]`)
  }
}

export function reportExtraError(cxt: KeywordContext, error: KeywordErrorDefinition): void {
  const {gen, compositeRule, opts, async} = cxt.it
  const errObj = errorObjectCode(cxt, error)
  addError(gen, errObj)
  if (!(compositeRule || opts.allErrors)) {
    returnErrors(gen, async, "vErrors")
  }
}

export function resetErrorsCount(gen: CodeGen, errsCount: string): void {
  gen.code(
    `errors = ${errsCount};
    if (vErrors !== null) {
      if (${errsCount}) vErrors.length = ${errsCount};
      else vErrors = null;
    }`
  )
}

function addError(gen: CodeGen, errObj: string): void {
  const err = gen.name("err")
  gen.code(
    `const ${err} = ${errObj};
    if (vErrors === null) vErrors = [${err}];
    else vErrors.push(${err});
    errors++;`
  )
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
    it: {createErrors, schemaPath, errorPath, errSchemaPath, opts},
  } = cxt
  if (createErrors === false) return "{}"
  if (!error) throw new Error('keyword definition must have "error" property')
  // TODO trim whitespace
  let out = `{
    keyword: "${keyword}",
    dataPath: (dataPath || "") + ${errorPath},
    schemaPath: ${toQuotedString(errSchemaPath + "/" + keyword)},
    params: ${error.params(cxt)},`
  if (opts.messages !== false) out += `message: ${error.message(cxt)},`
  if (opts.verbose) {
    // TODO trim whitespace
    out += `
      schema: ${schemaValue},
      parentSchema: validate.schema${schemaPath},
      data: ${data},`
  }
  return out + "}"
}
