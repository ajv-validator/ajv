import type {AnySchema, SchemaMap, SchemaCxt, SchemaObjCxt} from "../types"
import type KeywordCxt from "../compile/context"
import {schemaHasRules} from "../compile/util"
import {CodeGen, _, strConcat, nil, Code, Name, getProperty} from "../compile/codegen"
import N from "../compile/names"

export function schemaRefOrVal(
  {topSchemaRef, schemaPath}: SchemaObjCxt,
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

export function alwaysValidSchema(it: SchemaCxt, schema: AnySchema): boolean | void {
  if (typeof schema == "boolean") return schema
  if (Object.keys(schema).length === 0) return true
  checkUnknownRules(it, schema)
  return !schemaHasRules(schema, it.self.RULES.all)
}

export function checkUnknownRules(it: SchemaCxt, schema: AnySchema = it.schema): void {
  const {opts, self} = it
  if (!opts.strict) return
  if (typeof schema === "boolean") return
  const rules = self.RULES.keywords
  for (const key in schema) {
    if (!rules[key]) checkStrictMode(it, `unknown keyword: "${key}"`)
  }
}

export function allSchemaProperties(schemaMap?: SchemaMap): string[] {
  return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : []
}

export function schemaProperties(it: SchemaCxt, schemaMap: SchemaMap): string[] {
  return allSchemaProperties(schemaMap).filter(
    (p) => !alwaysValidSchema(it, schemaMap[p] as AnySchema)
  )
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
  {schemaCode, data, it: {gen, topSchemaRef, schemaPath, errorPath}, it}: KeywordCxt,
  func: Code,
  context: Code,
  passSchema?: boolean
): Code {
  const dataAndSchema = passSchema ? _`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data
  const dataCxt = gen.object(
    [N.dataPath, strConcat(N.dataPath, errorPath)],
    [N.parentData, it.parentData],
    [N.parentDataProperty, it.parentDataProperty],
    [N.rootData, N.rootData]
  )
  const args = _`${dataAndSchema}, ${dataCxt}`
  return context !== nil ? _`${func}.call(${context}, ${args})` : _`${func}(${args})`
}

export function usePattern(gen: CodeGen, pattern: string): Name {
  return gen.scopeValue("pattern", {
    key: pattern,
    ref: new RegExp(pattern, "u"),
    code: _`new RegExp(${pattern}, "u")`,
  })
}

export function checkStrictMode(it: SchemaCxt, msg: string, mode = it.opts.strict): void {
  if (!mode) return
  msg = `strict mode: ${msg}`
  if (mode === true) throw new Error(msg)
  it.self.logger.warn(msg)
}
