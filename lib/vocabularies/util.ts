import {getProperty, schemaHasRules} from "../compile/util"
import {CompilationContext, KeywordContext} from "../types"
import {_, Code, Name, Expression} from "../compile/codegen"

export function quotedString(str: string): string {
  return JSON.stringify(str)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

export function dataNotType(
  schemaCode: Expression | number | boolean,
  schemaType: string,
  $data?: string | false
): string {
  return $data ? `(${schemaCode}!==undefined && typeof ${schemaCode}!=="${schemaType}") || ` : ""
}

export function schemaRefOrVal(
  {topSchemaRef, schemaPath}: CompilationContext,
  schema: unknown,
  keyword: string,
  $data?: string | false
): Expression | number | boolean {
  // return $data || typeof schema === "object"
  //   ? `${topSchemaRef}${schemaPath + getProperty(keyword)}`
  //   : _`${schema}`
  if (!$data) {
    if (typeof schema == "number" || typeof schema == "boolean") return schema
    if (typeof schema == "string") return _`${schema}`
  }
  return `${topSchemaRef}${schemaPath + getProperty(keyword)}`
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

export function isOwnProperty(data: Name, property: Expression): Expression {
  const prop = property instanceof Code ? property : quotedString(property)
  return `Object.prototype.hasOwnProperty.call(${data}, ${prop})`
}

export function propertyInData(data: Name, property: Expression, ownProperties?: boolean): string {
  let cond = `${data}${accessProperty(property)} !== undefined`
  if (ownProperties) cond += ` && ${isOwnProperty(data, property)}`
  return cond
}

export function noPropertyInData(
  data: Name,
  property: Expression,
  ownProperties?: boolean
): string {
  let cond = `${data}${accessProperty(property)} === undefined`
  if (ownProperties) cond += ` || !${isOwnProperty(data, property)}`
  return cond
}

export function accessProperty(property: Expression | number): string {
  return property instanceof Code ? `[${property}]` : getProperty(property)
}

export function loopPropertiesCode(
  {gen, data, it}: KeywordContext,
  loopBody: (key: Name) => void
): void {
  // TODO maybe always iterate own properties in v7?
  const key = gen.name("key")
  const iteration = it.opts.ownProperties ? `of Object.keys(${data})` : `in ${data}`
  gen.for(`const ${key} ${iteration}`, () => loopBody(key))
}

export function orExpr(items: string[], mapCondition: (s: string, i: number) => string): string {
  return items.map(mapCondition).reduce((expr, cond) => `${expr} || ${cond}`)
}

export interface ParentData {
  data: string
  property: string
}

export function getParentData({dataLevel, dataPathArr}: CompilationContext): ParentData {
  return dataLevel
    ? {data: `data${dataLevel - 1 || ""}`, property: `${dataPathArr[dataLevel]}`}
    : {data: "parentData", property: "parentDataProperty"}
}

export function callValidate(
  {schemaCode, data, it}: KeywordContext,
  func: Expression,
  context?: string,
  passSchema?: boolean
): string {
  const dataAndSchema = passSchema
    ? `${schemaCode}, ${data}, ${it.topSchemaRef}${it.schemaPath}`
    : data
  const dataPath = `(dataPath || '')${it.errorPath === '""' ? "" : ` + ${it.errorPath}`}` // TODO joinPaths?
  const parent = getParentData(it)
  const args = `${dataAndSchema}, ${dataPath}, ${parent.data}, ${parent.property}, rootData`
  return context ? `${func}.call(${context}, ${args})` : `${func}(${args})`
}
