// TODO use $data in keyword definitions
const KEYWORDS = [
  "multipleOf",
  "maximum",
  "exclusiveMaximum",
  "minimum",
  "exclusiveMinimum",
  "maxLength",
  "minLength",
  "pattern",
  "additionalItems",
  "maxItems",
  "minItems",
  "uniqueItems",
  "maxProperties",
  "minProperties",
  "required",
  "additionalProperties",
  "enum",
  "format",
  "const",
]

export default function $dataMetaSchema(
  metaSchema: object,
  keywordsJsonPointers: string[]
): object {
  for (const jsonPointer of keywordsJsonPointers) {
    metaSchema = JSON.parse(JSON.stringify(metaSchema))
    const segments = jsonPointer.split("/").slice(1) // first segment is an empty string
    let keywords = metaSchema
    for (const seg of segments) keywords = keywords[seg]

    for (const key of KEYWORDS) {
      const schema = keywords[key]
      if (schema) keywords[key] = schemaOrData(schema)
    }
  }

  return metaSchema
}

function schemaOrData(schema: object): object {
  return {
    anyOf: [
      schema,
      {
        $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
      },
    ],
  }
}

module.exports = $dataMetaSchema
