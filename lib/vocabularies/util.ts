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
  schemaType?: string,
  $data?: string | false
): string {
  return $data
    ? `(${schemaCode}!==undefined && typeof ${schemaCode}!=="${schemaType}") || `
    : ""
}
