export default function $dataMetaSchema(
  this,
  metaSchema: object,
  keywordsJsonPointers: string[]
): object {
  const rules = this.RULES.all
  for (const jsonPointer of keywordsJsonPointers) {
    metaSchema = JSON.parse(JSON.stringify(metaSchema))
    const segments = jsonPointer.split("/").slice(1) // first segment is an empty string
    let keywords = metaSchema
    for (const seg of segments) keywords = keywords[seg]

    for (const key in rules) {
      const $data = rules[key]?.definition?.$data
      const schema = keywords[key]
      if ($data && schema) keywords[key] = schemaOrData(schema)
    }
  }

  return metaSchema
}

const $dataRef = {
  $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
}

export function schemaOrData(schema: object | boolean): object {
  return {anyOf: [schema, $dataRef]}
}
