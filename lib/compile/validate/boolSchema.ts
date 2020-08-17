import {KeywordErrorDefinition, CompilationContext, KeywordContext} from "../../types"
import {reportError} from "../errors"

const boolError: KeywordErrorDefinition = {
  message: () => '"boolean schema is false"',
  params: () => "{}",
}

export function booleanOrEmptySchema(it: CompilationContext, valid: string): void {
  const {gen, isTop, schema} = it
  if (isTop) {
    if (schema === false) {
      falseSchemaError(it, false)
    } else if (schema.$async === true) {
      gen.code("return data;")
    } else {
      gen.code("validate.errors = null; return true;")
    }
    gen.code(
      `};
      return validate;`
    )
  } else {
    if (schema === false) {
      gen.code(`var ${valid} = false;`) // TODO var
      falseSchemaError(it)
    } else {
      gen.code(`var ${valid} = true;`) // TODO var
    }
  }
}

function falseSchemaError(it: CompilationContext, allErrors?: boolean) {
  const {gen, dataLevel} = it
  // TODO maybe some other interface should be used for non-keyword validation errors...
  const cxt: KeywordContext = {
    gen,
    fail: exception,
    ok: exception,
    errorParams: exception,
    keyword: "false schema",
    data: "data" + (dataLevel || ""),
    schema: false,
    schemaCode: false,
    schemaValue: false,
    parentSchema: false,
    it,
  }
  reportError(cxt, boolError, allErrors)
}

// TODO combine with exception from dataType
function exception() {
  throw new Error("this function can only be used in keyword")
}
