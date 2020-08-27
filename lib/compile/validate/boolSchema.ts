import {KeywordErrorDefinition, CompilationContext, KeywordErrorContext} from "../../types"
import {reportError} from "../errors"
import {_, Name} from "../codegen"
import N from "../names"

const boolError: KeywordErrorDefinition = {
  message: "boolean schema is false",
}

export function topBoolOrEmptySchema(it: CompilationContext): void {
  const {gen, schema} = it
  if (schema === false) {
    falseSchemaError(it, false)
  } else if (schema.$async === true) {
    gen.return(N.data)
  } else {
    gen.assign(_`${N.validate}.errors`, "null")
    gen.return(true)
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
  const {gen, data} = it
  // TODO maybe some other interface should be used for non-keyword validation errors...
  const cxt: KeywordErrorContext = {
    gen,
    keyword: "false schema",
    data,
    schema: false,
    schemaCode: false,
    schemaValue: false,
    parentSchema: false,
    params: {},
    it,
  }
  reportError(cxt, boolError, overrideAllErrors)
}
