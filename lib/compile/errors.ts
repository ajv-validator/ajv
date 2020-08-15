import {KeywordContext, KeywordErrorDefinition} from "../types"
import {toQuotedString} from "./util"

export function reportError(
  cxt: KeywordContext,
  error: KeywordErrorDefinition,
  allErrors?: boolean
): void {
  const {gen, compositeRule, opts, async} = cxt.it
  const errObj = errorObjectCode(cxt, error)
  if (allErrors ?? (compositeRule || opts.allErrors)) {
    const err = gen.name("err")
    gen.code(
      `const ${err} = ${errObj};
      if (vErrors === null) vErrors = [${err}];
      else vErrors.push(${err});
      errors++;`
    )
  } else {
    gen.code(
      async
        ? `throw new ValidationError([${errObj}]);`
        : `validate.errors = [${errObj}];
        return false;`
    )
  }
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
