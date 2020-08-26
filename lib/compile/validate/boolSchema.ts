import {KeywordErrorDefinition, CompilationContext, KeywordContext} from "../../types"
import {reportError} from "../errors"
import {_, Name} from "../codegen"

const boolError: KeywordErrorDefinition = {
  message: "boolean schema is false",
}

export function topBoolOrEmptySchema(it: CompilationContext): void {
  const {gen, schema} = it
  if (schema === false) {
    falseSchemaError(it, false)
  } else if (schema.$async === true) {
    gen.code(_`return data;`)
  } else {
    gen.code(_`validate.errors = null; return true;`)
  }
}

export function boolOrEmptySchema(it: CompilationContext, valid: Name): void {
  const {gen, schema} = it
  if (schema === false) {
    gen.var(valid, false) // TODO var
    falseSchemaError(it)
  } else {
    gen.var(valid, true) // TODO var
  }
}

function falseSchemaError(it: CompilationContext, overrideAllErrors?: boolean) {
  const {gen, dataLevel} = it
  // TODO maybe some other interface should be used for non-keyword validation errors...
  const cxt: KeywordContext = {
    gen,
    ok: exception,
    pass: exception,
    fail: exception,
    errorParams: exception,
    keyword: "false schema",
    data: new Name("data" + (dataLevel || "")), // TODO refactor dataLevel
    schema: false,
    schemaCode: false,
    schemaValue: false,
    parentSchema: false,
    params: {},
    it,
  }
  reportError(cxt, boolError, overrideAllErrors)
}

// TODO combine with exception from dataType
function exception() {
  throw new Error("this function can only be used in keyword")
}
