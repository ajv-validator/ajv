import {CompilationContext} from "../types"
import validateCode from "./validate"
import {getProperty, escapeFragment} from "./util"

export interface SubschemaContext {
  schema: any
  schemaPath: string
  errSchemaPath: string
  compositeRule?: true
}

export function applySchema(it: CompilationContext, subschema: SubschemaContext): string {
  const {gen, level} = it
  const nextContext = {...it, ...subschema, level: level + 1}
  const nextValid = gen.name("valid")
  // TODO remove true once appendGen is removed
  validateCode(nextContext, nextValid, true)
  return nextValid
}

export function applyKeywordSubschema(
  it: CompilationContext,
  keyword: string,
  prop: string | number,
  compositeRule?: true
): string {
  const subschema: SubschemaContext = {
    schema: it.schema[keyword][prop],
    schemaPath: it.schemaPath + getProperty(keyword) + getProperty(prop),
    errSchemaPath: `${it.errSchemaPath}/${keyword}/${escapeFragment("" + prop)}`,
  }
  if (compositeRule) subschema.compositeRule = compositeRule
  return applySchema(it, subschema)
}
