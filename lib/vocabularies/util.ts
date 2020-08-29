import {getProperty, schemaHasRules} from "../compile/util"
import {CompilationContext} from "../types"
import KeywordContext from "../compile/context"
import CodeGen, {_, Code, Name, Expression} from "../compile/codegen"
import N from "../compile/names"

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

export function isOwnProperty(data: Name, property: Expression): Code {
  return _`Object.prototype.hasOwnProperty.call(${data}, ${property})`
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

export function accessProperty(property: Expression | number): Expression {
  return property instanceof Code ? _`[${property}]` : getProperty(property)
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

export function orExpr(
  items: string[],
  mapCondition: (s: string, i: number) => Expression
): Expression {
  return items.map(mapCondition).reduce((expr, cond) => `${expr} || ${cond}`)
}

export interface ParentData {
  data: Name
  property: Expression | number
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
  const dataPath = `(${N.dataPath} || '')${it.errorPath === '""' ? "" : ` + ${it.errorPath}`}` // TODO joinPaths?
  const args = `${dataAndSchema}, ${dataPath}, ${it.parentData}, ${it.parentDataProperty}, ${N.rootData}`
  return context ? `${func}.call(${context}, ${args})` : `${func}(${args})`
}

export function usePattern(gen: CodeGen, pattern: string): Name {
  return gen.value("pattern", {
    key: pattern,
    ref: new RegExp(pattern),
    code: _`new RegExp(${pattern})`,
  })
}
