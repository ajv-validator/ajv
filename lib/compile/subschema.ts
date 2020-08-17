import {CompilationContext} from "../types"
import validateCode from "./validate"
import {getProperty, escapeFragment} from "./util"

export interface Subschema {
  schema: any
  schemaPath: string
  errSchemaPath: string
}

export function applySchema(it: CompilationContext, subschema: Subschema): string {
  const {gen, level} = it
  const nextIt = {...it, ...subschema, level: level + 1}
  const nextValid = gen.name("valid")
  // TODO remove true once appendGen is removed
  validateCode(nextIt, nextValid, true)
  return nextValid
}

export function applyKeywordSubschema(
  it: CompilationContext,
  keyword: string,
  prop: string | number
): string {
  return applySchema(it, {
    schema: it.schema[keyword][prop],
    schemaPath: it.schemaPath + getProperty(keyword) + getProperty(prop),
    errSchemaPath: `${it.errSchemaPath}/${keyword}/${escapeFragment("" + prop)}`,
  })
}
