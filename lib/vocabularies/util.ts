import {schemaHasRules} from "../compile/util"
import {Schema, SchemaMap, SchemaCtx, SchemaObjCtx} from "../types"
import KeywordCtx from "../compile/context"
import CodeGen, {_, nil, Code, Name, getProperty} from "../compile/codegen"
import N from "../compile/names"

export function schemaRefOrVal(
  {topSchemaRef, schemaPath}: SchemaObjCtx,
  schema: unknown,
  keyword: string,
  $data?: string | false
): Code | number | boolean {
  if (!$data) {
    if (typeof schema == "number" || typeof schema == "boolean") return schema
    if (typeof schema == "string") return _`${schema}`
  }
  return _`${topSchemaRef}${schemaPath}${getProperty(keyword)}`
}

export function alwaysValidSchema(it: SchemaCtx, schema: Schema): boolean | void {
  if (typeof schema == "boolean") return schema
  if (Object.keys(schema).length === 0) return true
  checkUnknownRules(it, schema)
  return !schemaHasRules(schema, it.RULES.all)
}

export function checkUnknownRules(it: SchemaCtx, schema: Schema = it.schema): void {
  if (!it.opts.strict) return
  if (typeof schema === "boolean") return
  const rules = it.RULES.keywords
  for (const key in schema) {
    if (!rules[key]) checkStrictMode(it, `unknown keyword: "${key}"`)
  }
}

export function allSchemaProperties(schemaMap?: SchemaMap): string[] {
  return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : []
}

export function schemaProperties(it: SchemaCtx, schemaMap: SchemaMap): string[] {
  return allSchemaProperties(schemaMap).filter((p) => !alwaysValidSchema(it, schemaMap[p]))
}

function isOwnProperty(data: Name, property: Name | string): Code {
  return _`Object.prototype.hasOwnProperty.call(${data}, ${property})`
}

export function propertyInData(data: Name, property: Name | string, ownProperties?: boolean): Code {
  const cond = _`${data}${getProperty(property)} !== undefined`
  return ownProperties ? _`${cond} && ${isOwnProperty(data, property)}` : cond
}

export function noPropertyInData(
  data: Name,
  property: Name | string,
  ownProperties?: boolean
): Code {
  const cond = _`${data}${getProperty(property)} === undefined`
  return ownProperties ? _`${cond} || !${isOwnProperty(data, property)}` : cond
}

export function callValidateCode(
  {schemaCode, data, it}: KeywordCtx,
  func: Code,
  context: Code,
  passSchema?: boolean
): Code {
  const dataAndSchema = passSchema
    ? _`${schemaCode}, ${data}, ${it.topSchemaRef}${it.schemaPath}`
    : data
  const dataPath = _`(${N.dataPath} || '') + ${it.errorPath}` // TODO refactor other places
  const args = _`${dataAndSchema}, ${dataPath}, ${it.parentData}, ${it.parentDataProperty}, ${N.rootData}`
  return context !== nil ? _`${func}.call(${context}, ${args})` : _`${func}(${args})`
}

export function usePattern(gen: CodeGen, pattern: string): Name {
  return gen.value("pattern", {
    key: pattern,
    ref: new RegExp(pattern),
    code: _`new RegExp(${pattern})`,
  })
}

export function checkStrictMode(it: SchemaCtx, msg: string): void {
  const {opts, logger} = it
  if (opts.strict) {
    if (opts.strict === "log") logger.warn(msg)
    else throw new Error(msg)
  }
}
