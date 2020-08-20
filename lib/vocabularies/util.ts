import {getProperty, schemaHasRules} from "../compile/util"
import {CompilationContext} from "../types"

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

// TODO remove
// export function nonEmptySchema(
//   {RULES, opts: {strictKeywords}}: CompilationContext,
//   schema: boolean | object
// ): boolean | void {
//   return strictKeywords
//     ? (typeof schema == "object" && Object.keys(schema).length > 0) || schema === false
//     : schemaHasRules(schema, RULES.all)
// }

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

export function isOwnProperty(data: string, property: string): string {
  return `Object.prototype.hasOwnProperty.call(${data}, ${quotedString(property)})`
}

export function propertyInData(data: string, propertry: string, ownProperties?: boolean): string {
  let cond = `${data}${getProperty(propertry)} !== undefined`
  if (ownProperties) cond += ` && ${isOwnProperty(data, propertry)}`
  return cond
}

export function noPropertyInData(data: string, propertry: string, ownProperties?: boolean): string {
  let cond = `${data}${getProperty(propertry)} === undefined`
  if (ownProperties) cond += ` || !${isOwnProperty(data, propertry)}`
  return cond
}
