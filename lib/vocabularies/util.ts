import {schemaHasRules} from "../compile/util"
import {CompilationContext} from "../types"
import KeywordContext from "../compile/context"
import CodeGen, {_, nil, Code, Name, getProperty} from "../compile/codegen"
import N from "../compile/names"

export function schemaRefOrVal(
  {topSchemaRef, schemaPath}: CompilationContext,
  schema: unknown,
  keyword: string,
  $data?: string | false
): Code | number | boolean {
  // return $data || typeof schema === "object"
  //   ? `${topSchemaRef}${schemaPath + getProperty(keyword)}`
  //   : _`${schema}`
  if (!$data) {
    if (typeof schema == "number" || typeof schema == "boolean") return schema
    if (typeof schema == "string") return _`${schema}`
  }
  return _`${topSchemaRef}${schemaPath}${getProperty(keyword)}`
}

export function alwaysValidSchema(
  {RULES, opts: {strictKeywords}}: CompilationContext,
  schema: boolean | object
): boolean | void {
  return typeof schema == "boolean"
    ? schema === true
    : strictKeywords
    ? Object.keys(schema).length === 0
    : !schemaHasRules(schema, RULES.all)
}

export function allSchemaProperties(schema?: object): string[] {
  return schema ? Object.keys(schema).filter((p) => p !== "__proto__") : []
}

export function schemaProperties(it: CompilationContext, schema: object): string[] {
  return allSchemaProperties(schema).filter((p) => !alwaysValidSchema(it, schema[p]))
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
  {schemaCode, data, it}: KeywordContext,
  func: Code,
  context: Code,
  passSchema?: boolean
): Code {
  const dataAndSchema = passSchema
    ? _`${schemaCode}, ${data}, ${it.topSchemaRef}${it.schemaPath}`
    : data
  // const appendErrPath = it.errorPath.toString() === '""' ? nil : _` + ${it.errorPath}`
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
