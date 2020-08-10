export function appendSchema(
  schemaCode: string | number,
  $data?: string | false
): string {
  return $data ? `" + ${schemaCode}` : `${schemaCode}"`
}

export function concatSchema(
  schemaCode: string | number,
  $data?: string | false
): string | number {
  return $data ? `" + ${schemaCode} + "` : schemaCode
}

export function dataNotType(
  schemaCode: string | number,
  schemaType?: string,
  $data?: string | false
): string {
  return $data
    ? `(${schemaCode}!==undefined && typeof ${schemaCode}!=="${schemaType}") || `
    : ""
}
