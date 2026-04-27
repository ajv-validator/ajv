import type Ajv from ".."
import type AjvPack from "../dist/standalone/instance"
import type AjvCore from "../dist/core"
import type {SchemaObject} from ".."
import _Ajv from "./ajv"
import _Ajv2019 from "./ajv2019"
import getAjvInstances from "./ajv_instances"
import {withStandalone} from "./ajv_standalone"
import options from "./ajv_options"
import * as assert from "assert"

describe("discriminator keyword", function () {
  let ajvs: (Ajv | AjvPack)[]

  this.timeout(10000)

  before(() => {
    ajvs = [...getAjvs(_Ajv), ...getAjvs(_Ajv2019)]
  })

  function getAjvs(AjvClass: typeof AjvCore) {
    return withStandalone(getAjvInstances(AjvClass, options, {discriminator: true}))
  }

  describe("validation", () => {
    const schema1 = {
      type: "object",
      discriminator: {propertyName: "foo"},
      oneOf: [
        {
          properties: {
            foo: {const: "x"},
            a: {type: "string"},
          },
          required: ["foo", "a"],
        },
        {
          properties: {
            foo: {enum: ["y", "z"]},
            b: {type: "string"},
          },
          required: ["foo", "b"],
        },
      ],
    }

    const schema2 = {
      type: "object",
      discriminator: {propertyName: "foo"},
      required: ["foo"],
      oneOf: [
        {
          properties: {
            foo: {const: "x"},
            a: {type: "string"},
          },
          required: ["a"],
        },
        {
          properties: {
            foo: {enum: ["y", "z"]},
            b: {type: "string"},
          },
          required: ["b"],
        },
      ],
    }

    const schemas = [schema1, schema2]

    it("should validate data", () => {
      assertValid(schemas, {foo: "x", a: "a"})
      assertValid(schemas, {foo: "y", b: "b"})
      assertValid(schemas, {foo: "z", b: "b"})
      assertInvalid(schemas, {})
      assertInvalid(schemas, {foo: 1})
      assertInvalid(schemas, {foo: "bar"})
      assertInvalid(schemas, {foo: "x", b: "b"})
      assertInvalid(schemas, {foo: "y", a: "a"})
      assertInvalid(schemas, {foo: "z", a: "a"})
    })
  })

  describe("validation with referenced schemas", () => {
    const definitions1 = {
      schema1: {
        properties: {
          foo: {const: "x"},
          a: {type: "string"},
        },
        required: ["foo", "a"],
      },
      schema2: {
        properties: {
          foo: {enum: ["y", "z"]},
          b: {type: "string"},
        },
        required: ["foo", "b"],
      },
    }
    const mainSchema1 = {
      type: "object",
      discriminator: {propertyName: "foo"},
      oneOf: [
        {
          $ref: "#/definitions/schema1",
        },
        {
          $ref: "#/definitions/schema2",
        },
      ],
    }

    const definitions2 = {
      schema1: {
        properties: {
          foo: {const: "x"},
          a: {type: "string"},
        },
        required: ["a"],
      },
      schema2: {
        properties: {
          foo: {enum: ["y", "z"]},
          b: {type: "string"},
        },
        required: ["b"],
      },
    }
    const mainSchema2 = {
      type: "object",
      discriminator: {propertyName: "foo"},
      required: ["foo"],
      oneOf: [
        {
          $ref: "#/definitions/schema1",
        },
        {
          $ref: "#/definitions/schema2",
        },
      ],
    }

    const schema = [
      {definitions: definitions1, ...mainSchema1},
      {definitions: definitions2, ...mainSchema2},
    ]

    it("should validate data", () => {
      assertValid(schema, {foo: "x", a: "a"})
      assertValid(schema, {foo: "y", b: "b"})
      assertValid(schema, {foo: "z", b: "b"})
      assertInvalid(schema, {})
      assertInvalid(schema, {foo: 1})
      assertInvalid(schema, {foo: "bar"})
      assertInvalid(schema, {foo: "x", b: "b"})
      assertInvalid(schema, {foo: "y", a: "a"})
      assertInvalid(schema, {foo: "z", a: "a"})
    })
  })

  describe("schema with external $refs", () => {
    const schemas = {
      main: {
        type: "object",
        discriminator: {propertyName: "foo"},
        required: ["foo"],
        oneOf: [
          {
            $ref: "schema1",
          },
          {
            $ref: "schema2",
          },
        ],
      },
      schema1: {
        type: "object",
        properties: {
          foo: {const: "x"},
        },
      },
      schema2: {
        type: "object",
        properties: {
          foo: {enum: ["y", "z"]},
        },
      },
    }

    const data = {foo: "x"}
    const badData = {foo: "w"}

    it("compile should resolve each $ref to a schema that was added with addSchema", () => {
      const opts = {
        discriminator: true,
      }
      const ajv = new _Ajv(opts)
      ajv.addSchema(schemas.main, "https://host/main")
      ajv.addSchema(schemas.schema1, "https://host/schema1")
      ajv.addSchema(schemas.schema2, "https://host/schema2")

      const validate = ajv.compile({$ref: "https://host/main"})
      assert.strictEqual(validate(data), true)
      assert.strictEqual(validate(badData), false)
    })
    it("compileAsync should loadSchema each $ref", async () => {
      const opts = {
        discriminator: true,
        loadSchema(url) {
          if (!url.startsWith("https://host/")) return undefined
          const name = url.substring("https://host/".length)
          return schemas[name]
        },
      }
      const ajv = new _Ajv(opts)
      const validate = await ajv.compileAsync({$ref: "https://host/main"})
      assert.strictEqual(validate(data), true)
      assert.strictEqual(validate(badData), false)
    })
  })

  describe("validation with deeply referenced schemas", () => {
    const schema = [
      {
        type: "object",
        properties: {
          container: {
            $ref: "#/definitions/Container",
          },
        },
        definitions: {
          BlockA: {
            type: "object",
            properties: {
              _type: {
                type: "string",
                enum: ["a"],
              },
              a: {type: "string"},
            },
            additionalProperties: false,
            required: ["_type"],
            title: "BlockA",
          },
          BlockB: {
            type: "object",
            properties: {
              _type: {
                type: "string",
                enum: ["b"],
              },
              b: {type: "string"},
            },
            additionalProperties: false,
            required: ["_type"],
            title: "BlockB",
          },
          Container: {
            type: "object",
            properties: {
              list: {
                type: "array",
                items: {
                  oneOf: [
                    {
                      $ref: "#/definitions/BlockA",
                    },
                    {
                      $ref: "#/definitions/BlockB",
                    },
                  ],
                  discriminator: {
                    propertyName: "_type",
                  },
                },
              },
            },
          },
        },
      },
    ]

    it("should validate data", () => {
      assertValid(schema, {
        container: {
          list: [
            {_type: "a", a: "foo"},
            {_type: "b", b: "bar"},
          ],
        },
      })

      assertInvalid(schema, {
        container: {
          list: [
            {_type: "a", b: "foo"},
            {_type: "b", b: "bar"},
          ],
        },
      })
    })
  })

  describe("validation with nested discriminator (union of unions)", () => {
    const schema = [
      {
        type: "object",
        discriminator: {propertyName: "type"},
        required: ["type"],
        oneOf: [
          {
            discriminator: {propertyName: "type"},
            required: ["type"],
            oneOf: [
              {
                properties: {
                  type: {type: "string", const: "a"},
                  fieldA: {type: "number"},
                },
                required: ["type", "fieldA"],
              },
              {
                properties: {
                  type: {type: "string", const: "b"},
                  fieldB: {type: "number"},
                },
                required: ["type", "fieldB"],
              },
            ],
          },
          {
            properties: {
              type: {type: "string", const: "c"},
              fieldC: {type: "number"},
            },
            required: ["type", "fieldC"],
          },
        ],
      },
    ]

    it("should validate data", () => {
      assertValid(schema, {type: "a", fieldA: 1})
      assertValid(schema, {type: "b", fieldB: 2})
      assertValid(schema, {type: "c", fieldC: 3})
      assertInvalid(schema, {})
      assertInvalid(schema, {type: 1})
      assertInvalid(schema, {type: "unknown"})
      assertInvalid(schema, {type: "a", fieldB: 1})
      assertInvalid(schema, {type: "b", fieldA: 1})
      assertInvalid(schema, {type: "c", fieldA: 1})
    })
  })

  describe("validation with deeply nested discriminator (3 levels)", () => {
    const schema = [
      {
        type: "object",
        discriminator: {propertyName: "type"},
        required: ["type"],
        oneOf: [
          {
            discriminator: {propertyName: "type"},
            required: ["type"],
            oneOf: [
              {
                discriminator: {propertyName: "type"},
                required: ["type"],
                oneOf: [
                  {
                    properties: {
                      type: {type: "string", const: "a"},
                      fieldA: {type: "number"},
                    },
                    required: ["type", "fieldA"],
                  },
                  {
                    properties: {
                      type: {type: "string", const: "b"},
                      fieldB: {type: "number"},
                    },
                    required: ["type", "fieldB"],
                  },
                ],
              },
              {
                properties: {
                  type: {type: "string", const: "c"},
                  fieldC: {type: "number"},
                },
                required: ["type", "fieldC"],
              },
            ],
          },
          {
            properties: {
              type: {type: "string", const: "d"},
              fieldD: {type: "number"},
            },
            required: ["type", "fieldD"],
          },
        ],
      },
    ]

    it("should validate data", () => {
      assertValid(schema, {type: "a", fieldA: 1})
      assertValid(schema, {type: "b", fieldB: 2})
      assertValid(schema, {type: "c", fieldC: 3})
      assertValid(schema, {type: "d", fieldD: 4})
      assertInvalid(schema, {})
      assertInvalid(schema, {type: "unknown"})
      assertInvalid(schema, {type: "a", fieldD: 1})
    })
  })

  describe("validation with allOf subschemas", () => {
    const schema = [
      {
        type: "object",
        discriminator: {propertyName: "type"},
        required: ["type"],
        oneOf: [
          {
            allOf: [
              {
                properties: {
                  type: {type: "string", const: "a"},
                },
              },
              {
                properties: {
                  fieldA: {type: "number"},
                },
                required: ["fieldA"],
              },
            ],
          },
          {
            properties: {
              type: {type: "string", const: "b"},
              fieldB: {type: "number"},
            },
            required: ["type", "fieldB"],
          },
        ],
      },
    ]

    it("should validate data", () => {
      assertValid(schema, {type: "a", fieldA: 1})
      assertValid(schema, {type: "b", fieldB: 2})
      assertInvalid(schema, {})
      assertInvalid(schema, {type: 1})
      assertInvalid(schema, {type: "unknown"})
      assertInvalid(schema, {type: "a", fieldB: 1})
      assertInvalid(schema, {type: "b", fieldA: 1})
    })
  })

  describe("validation with anyOf subschemas", () => {
    const schema = [
      {
        type: "object",
        discriminator: {propertyName: "type"},
        required: ["type"],
        oneOf: [
          {
            anyOf: [
              {
                properties: {
                  type: {type: "string", const: "a"},
                },
              },
              {
                properties: {
                  fieldA: {type: "number"},
                },
                required: ["fieldA"],
              },
            ],
          },
          {
            properties: {
              type: {type: "string", const: "b"},
              fieldB: {type: "number"},
            },
            required: ["type", "fieldB"],
          },
        ],
      },
    ]

    it("should validate data", () => {
      assertValid(schema, {type: "a", fieldA: 1})
      assertValid(schema, {type: "b", fieldB: 2})
      assertValid(schema, {type: "a", fieldB: 1}) // anyOf: first sub-part matches (type=a)
      assertInvalid(schema, {})
      assertInvalid(schema, {type: 1})
      assertInvalid(schema, {type: "unknown"})
      assertInvalid(schema, {type: "b", fieldA: 1})
    })
  })

  describe("validation with allOf subschemas and required in composed schema", () => {
    const schema = [
      {
        type: "object",
        discriminator: {propertyName: "type"},
        oneOf: [
          {
            allOf: [
              {
                properties: {
                  type: {type: "string", const: "a"},
                },
                required: ["type"],
              },
              {
                properties: {
                  fieldA: {type: "number"},
                },
                required: ["fieldA"],
              },
            ],
          },
          {
            properties: {
              type: {type: "string", const: "b"},
              fieldB: {type: "number"},
            },
            required: ["type", "fieldB"],
          },
        ],
      },
    ]

    it("should validate data", () => {
      assertValid(schema, {type: "a", fieldA: 1})
      assertValid(schema, {type: "b", fieldB: 2})
      assertInvalid(schema, {})
      assertInvalid(schema, {type: "unknown"})
      assertInvalid(schema, {type: "a", fieldB: 1})
    })
  })

  describe("valid schemas", () => {
    it("should have oneOf", () => {
      invalidSchema(
        {type: "object", discriminator: {propertyName: "foo"}},
        /discriminator: requires oneOf/
      )
    })

    it("should have schema for tag", () => {
      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          required: ["foo"],
          oneOf: [{properties: {}}],
        },
        /discriminator: oneOf subschemas \(or referenced schemas\) must have "properties\/foo"/
      )
    })

    it("should have enum or const in schema for tag", () => {
      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          required: ["foo"],
          oneOf: [{properties: {foo: {}}}],
        },
        /discriminator: "properties\/foo" must have "const" or "enum"/
      )
    })

    it("tag value should be string", () => {
      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          required: ["foo"],
          oneOf: [{properties: {foo: {const: 1}}}],
        },
        /discriminator: "foo" values must be unique strings/
      )
    })

    it("tag values should be unique", () => {
      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          required: ["foo"],
          oneOf: [{properties: {foo: {const: "a"}}}, {properties: {foo: {const: "a"}}}],
        },
        /discriminator: "foo" values must be unique strings/
      )
    })

    it("tag should be required", () => {
      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          oneOf: [
            {properties: {foo: {const: "a"}}, required: ["foo"]},
            {properties: {foo: {const: "b"}}},
          ],
        },
        /discriminator: "foo" must be required/
      )
    })

    it("nested oneOf subschemas should have tag property", () => {
      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          required: ["foo"],
          oneOf: [
            {
              discriminator: {propertyName: "foo"},
              required: ["foo"],
              oneOf: [
                {properties: {foo: {const: "a"}}, required: ["foo"]},
                {properties: {}, required: ["foo"]},
              ],
            },
            {properties: {foo: {const: "c"}}, required: ["foo"]},
          ],
        },
        /discriminator: oneOf subschemas \(or referenced schemas\) must have "properties\/foo"/
      )
    })

    it("nested oneOf subschemas should have required tag", () => {
      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          oneOf: [
            {
              discriminator: {propertyName: "foo"},
              oneOf: [
                {properties: {foo: {const: "a"}}},
                {properties: {foo: {const: "b"}}, required: ["foo"]},
              ],
            },
            {properties: {foo: {const: "c"}}, required: ["foo"]},
          ],
        },
        /discriminator: "foo" must be required/
      )
    })

    it("allOf subschemas should have tag property", () => {
      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          required: ["foo"],
          oneOf: [
            {
              allOf: [{properties: {bar: {type: "string"}}}],
            },
            {properties: {foo: {const: "b"}}, required: ["foo"]},
          ],
        },
        /discriminator: oneOf subschemas \(or referenced schemas\) must have "properties\/foo"/
      )
    })

    it("allOf subschemas should have const or enum for tag", () => {
      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          required: ["foo"],
          oneOf: [
            {
              allOf: [{properties: {foo: {type: "string"}}}],
            },
            {properties: {foo: {const: "b"}}, required: ["foo"]},
          ],
        },
        /discriminator: "properties\/foo" must have "const" or "enum"/
      )
    })

    it("allOf subschemas should have required tag", () => {
      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          oneOf: [
            {
              allOf: [{properties: {foo: {const: "a"}}}, {properties: {bar: {type: "string"}}}],
            },
            {properties: {foo: {const: "b"}}, required: ["foo"]},
          ],
        },
        /discriminator: "foo" must be required/
      )
    })
  })

  function assertValid(schemas: SchemaObject[], data: unknown): void {
    schemas.forEach((schema) =>
      ajvs.forEach((ajv) => assert.strictEqual(ajv.validate(schema, data), true))
    )
  }

  function assertInvalid(schemas: SchemaObject[], data: unknown): void {
    schemas.forEach((schema) =>
      ajvs.forEach((ajv) => assert.strictEqual(ajv.validate(schema, data), false))
    )
  }

  function invalidSchema(schema: SchemaObject, error: any): void {
    ajvs.forEach((ajv) => assert.throws(() => ajv.compile(schema), error))
  }
})
