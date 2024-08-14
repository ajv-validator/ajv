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
    const stringSchema1 = {
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

    const stringSchema2 = {
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

    const numberSchema = {
      type: "object",
      discriminator: {propertyName: "foo"},
      required: ["foo"],
      oneOf: [
        {
          properties: {
            foo: {const: 1},
            a: {type: "string"},
          },
          required: ["a"],
        },
        {
          properties: {
            foo: {enum: [2, 3]},
            b: {type: "string"},
          },
          required: ["b"],
        },
      ],
    }

    const boolSchema = {
      type: "object",
      discriminator: {propertyName: "foo"},
      required: ["foo"],
      oneOf: [
        {
          properties: {
            foo: {const: true},
            a: {type: "string"},
          },
          required: ["a"],
        },
        {
          properties: {
            foo: {const: false},
            b: {type: "string"},
          },
          required: ["b"],
        },
      ],
    }

    const mixedSchema = {
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
            foo: {enum: [1, 2]},
            b: {type: "string"},
          },
          required: ["b"],
        },
        {
          properties: {
            foo: {const: true},
            c: {type: "string"},
          },
          required: ["c"],
        },
        {
          properties: {
            foo: {const: null},
            d: {type: "number"},
          },
          required: ["d"],
        },
      ],
    }

    const stringSchemas = [stringSchema1, stringSchema2]
    const numberSchemas = [numberSchema]
    const boolSchemas = [boolSchema]
    const mixedSchemas = [mixedSchema]

    it("should validate data for string discriminator", () => {
      assertValid(stringSchemas, {foo: "x", a: "a"})
      assertValid(stringSchemas, {foo: "y", b: "b"})
      assertValid(stringSchemas, {foo: "z", b: "b"})

      assertInvalid(stringSchemas, {})
      assertInvalid(stringSchemas, {foo: 1})
      assertInvalid(stringSchemas, {foo: "bar"})
      assertInvalid(stringSchemas, {foo: "x", b: "b"})
      assertInvalid(stringSchemas, {foo: "y", a: "a"})
      assertInvalid(stringSchemas, {foo: "z", a: "a"})
    })

    it("should validate data for number discriminator", () => {
      assertValid(numberSchemas, {foo: 1, a: "a"})
      assertValid(numberSchemas, {foo: 2, b: "b"})
      assertValid(numberSchemas, {foo: 3, b: "b"})

      assertInvalid(stringSchemas, {})
      assertInvalid(stringSchemas, {foo: "1"})
      assertInvalid(stringSchemas, {foo: "bar"})
      assertInvalid(numberSchemas, {foo: 1, b: "b"})
      assertInvalid(numberSchemas, {foo: 2, a: "a"})
      assertInvalid(numberSchemas, {foo: 3, a: "a"})
    })

    it("should validate data for boolean discriminator", () => {
      assertValid(boolSchemas, {foo: true, a: "a"})
      assertValid(boolSchemas, {foo: false, b: "b"})

      assertInvalid(boolSchemas, {})
      assertInvalid(boolSchemas, {foo: "1"})
      assertInvalid(boolSchemas, {foo: true, b: "b"})
      assertInvalid(boolSchemas, {foo: false, a: "a"})
    })

    it("should validate data for mixed type discriminator", () => {
      assertValid(mixedSchemas, {foo: "x", a: "a"})
      assertValid(mixedSchemas, {foo: 1, b: "b"})
      assertValid(mixedSchemas, {foo: 2, b: "b"})
      assertValid(mixedSchemas, {foo: true, c: "c"})
      assertValid(mixedSchemas, {foo: null, d: 123})

      assertInvalid(mixedSchemas, {})
      assertInvalid(mixedSchemas, {foo: "x"})
      assertInvalid(mixedSchemas, {foo: "x", b: "b"})
      assertInvalid(mixedSchemas, {foo: "x", c: "c"})
      assertInvalid(mixedSchemas, {foo: 1})
      assertInvalid(mixedSchemas, {foo: 1, a: "a"})
      assertInvalid(mixedSchemas, {foo: 1, c: "c"})
      assertInvalid(mixedSchemas, {foo: 2})
      assertInvalid(mixedSchemas, {foo: 2, a: "a"})
      assertInvalid(mixedSchemas, {foo: 2, c: "c"})
      assertInvalid(mixedSchemas, {foo: true})
      assertInvalid(mixedSchemas, {foo: true, a: "a"})
      assertInvalid(mixedSchemas, {foo: true, b: "b"})
      assertInvalid(mixedSchemas, {foo: null})
      assertInvalid(mixedSchemas, {foo: null, a: "a"})
      assertInvalid(mixedSchemas, {foo: null, b: "b"})
      assertInvalid(mixedSchemas, {foo: null, c: "c"})
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

    it("tag value should be string, number, boolean or null", () => {
      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          required: ["foo"],
          oneOf: [{properties: {foo: {const: {baz: "bar"}}}}],
        },
        /discriminator: "foo" values must be unique strings, numbers, booleans or nulls/
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
        /discriminator: "foo" values must be unique strings, numbers, booleans or nulls/
      )

      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          required: ["foo"],
          oneOf: [{properties: {foo: {const: 1}}}, {properties: {foo: {const: 1}}}],
        },
        /discriminator: "foo" values must be unique/
      )

      invalidSchema(
        {
          type: "object",
          discriminator: {propertyName: "foo"},
          required: ["foo"],
          oneOf: [{properties: {foo: {const: true}}}, {properties: {foo: {const: true}}}],
        },
        /discriminator: "foo" values must be unique/
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
  })

  function assertValid(schemas: SchemaObject[], data: unknown): void {
    schemas.forEach((schema) =>
      ajvs.forEach((ajv) => {
        const validate = ajv.compile(schema)
        const valid = validate(data)
        assert.strictEqual(valid, true)
      })
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
