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
  schema,
  schemaPath: string,
  keyword: string,
  $data?: string | false
): string | number | boolean {
  const t = typeof schema
  if (!$data) {
    if (t === "number" || t === "boolean") return schema
    if (t === "string") return quotedString(schema)
  }
  return `validate.schema${schemaPath + getProperty(keyword)}`
}

export function nonEmptySchema(
  {RULES, opts: {strictKeywords}}: CompilationContext,
  schema: boolean | object
): boolean | void {
  return strictKeywords
    ? (typeof schema == "object" && Object.keys(schema).length > 0) || schema === false
    : schemaHasRules(schema, RULES.all)
}
