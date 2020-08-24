const metaSchema = require("./refs/json-schema-draft-07.json")

export const definitionSchema: object = {
  $id: "https://github.com/ajv-validator/ajv/blob/master/lib/definition_schema.js",
  description: 'Keyword definition schema. "inline" keywords are replaced with "code" in Ajv v7',
  definitions: {
    simpleTypes: metaSchema.definitions.simpleTypes,
  },
  type: "object",
  dependencies: {
    schema: ["validate"],
    valid: {not: {required: ["macro"]}},
    $data: {anyOf: [{required: ["code"]}, {required: ["validate"]}]},
  },
  properties: {
    inline: false,
    validate: true,
    compile: true,
    macro: true,
    code: true,
    type: metaSchema.properties.type,
    schemaType: metaSchema.properties.type,
    schema: {type: "boolean"},
    dependencies: {
      type: "array",
      items: {type: "string"},
    },
    metaSchema: {type: "object"},
    modifying: {type: "boolean"},
    valid: {type: "boolean"},
    $data: {type: "boolean"},
    async: {type: "boolean"},
    errors: {
      anyOf: [{type: "boolean"}, {const: "full"}],
    },
  },
}
