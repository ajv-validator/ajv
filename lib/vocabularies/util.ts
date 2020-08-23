import {getProperty, schemaHasRules} from "../compile/util"
import {CompilationContext, KeywordContext} from "../types"
import {Expr} from "../compile/subschema"

export function appendSchema(
  schemaCode: string | number | boolean,
  $data?: string | false
): string {
  return $data ? `" + ${schemaCode}` : `${schemaCode}"`
}

export function concatSchema(
  schemaCode: string | number | boolean,
  $data?: string | false
): string | number | boolean {
  return $data ? `" + ${schemaCode} + "` : schemaCode
}

export function quotedString(str: string): string {
  return JSON.stringify(str)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

export function dataNotType(
  schemaCode: string | number | boolean,
  schemaType: string,
  $data?: string | false
): string {
  return $data ? `(${schemaCode}!==undefined && typeof ${schemaCode}!=="${schemaType}") || ` : ""
}

export function schemaRefOrVal(
  schema: unknown,
  schemaPath: string,
  keyword: string,
  $data?: string | false
): string | number | boolean {
  if (!$data) {
    if (typeof schema == "number" || typeof schema == "boolean") return schema
    if (typeof schema == "string") return quotedString(schema)
  }
  return `validate.schema${schemaPath + getProperty(keyword)}`
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

export function isOwnProperty(data: string, property: string, expr: Expr): string {
  const prop = expr === Expr.Const ? quotedString(property) : property
  return `Object.prototype.hasOwnProperty.call(${data}, ${prop})`
}

export function propertyInData(
  data: string,
  property: string,
  expr: Expr,
  ownProperties?: boolean
): string {
  let cond = `${data}${accessProperty(property, expr)} !== undefined`
  if (ownProperties) cond += ` && ${isOwnProperty(data, property, expr)}`
  return cond
}

export function noPropertyInData(
  data: string,
  property: string,
  expr: Expr,
  ownProperties?: boolean
): string {
  let cond = `${data}${accessProperty(property, expr)} === undefined`
  if (ownProperties) cond += ` || !${isOwnProperty(data, property, expr)}`
  return cond
}

function accessProperty(property: string | number, expr: Expr): string {
  return expr === Expr.Const ? getProperty(property) : `[${property}]`
}

export function loopPropertiesCode(
  {gen, data, it}: KeywordContext,
  loopBody: (key: string) => void
): void {
  // TODO maybe always iterate own properties in v7?
  const key = gen.name("key")
  const iteration = it.opts.ownProperties ? `of Object.keys(${data})` : `in ${data}`
  gen.for(`const ${key} ${iteration}`, () => loopBody(key))
}

export function orExpr(items: string[], mapCondition: (s: string, i: number) => string): string {
  return items.map(mapCondition).reduce((expr, cond) => `${expr} || ${cond}`)
}
