export function appendSchema(
  schemaCode: string,
  $data?: string | false
): string {
  return $data ? `" + ${schemaCode}` : `${schemaCode}"`
}

export function concatSchema(
  schemaCode: string,
  $data?: string | false
): string {
  return $data ? `" + ${schemaCode} + "` : schemaCode
}

export function dataNotType(
  schemaCode: string,
  schemaType?: string,
  $data?: string | false
): string {
  return $data
    ? `(${schemaCode}!==undefined && typeof ${schemaCode}!=="${schemaType}") || `
    : ""
}
