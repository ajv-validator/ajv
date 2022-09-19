import type Ajv from "../dist/ajv"
import type AjvPack from "../dist/standalone/instance"
import type AjvCore from "../dist/core"
import type {SchemaObject} from "../dist/ajv"
import _Ajv2020 from "./ajv2020"
import getAjvInstances from "./ajv_instances"
import {withStandalone} from "./ajv_standalone"
import options from "./ajv_options"
import * as assert from "assert"

describe("defaultUnevaluatedProperties=false option", function () {
  let ajvs: (Ajv | AjvPack)[]

  this.timeout(10000)

  before(() => {
    ajvs = [...getAjvs(_Ajv2020)]
  })

  function getAjvs(AjvClass: typeof AjvCore) {
    return withStandalone(
      getAjvInstances(AjvClass, options, {
        defaultUnevaluatedProperties: false,
      })
    )
  }

  describe("validation", () => {
    it("should not apply to schemas without properties/patternProperties", () => {
      const schema1 = {
        type: "object",
      }

      const schema2 = {
        type: "object",
        additionalProperties: true,
      }

      const schema3 = {
        type: "object",
        additionalProperties: {},
      }

      const schemas = [schema1, schema2, schema3]

      assertValid(schemas, {foo: "x", a: "a"})
      assertValid(schemas, {})
      assertInvalid(schemas, 1)
    })

    it("should apply to shemas with properties/patternProperties/additionalProperties", () => {
      const schema1 = {
        type: "object",
        properties: {},
      }

      const schema2 = {
        type: "object",
        patternProperties: {},
      }

      const schemas = [schema1, schema2]
      assertValid(schemas, {})
      assertInvalid(schemas, {foo: 1})
      assertInvalid(schemas, 1)
    })

    it("should apply for nested schemas", () => {
      const schema1 = {
        type: "object",
        properties: {
          foo: {
            type: "object",
            properties: {
              bar: {type: "string"},
            },
          },
        },
      }

      const schemas = [schema1]
      assertValid(schemas, {})
      assertValid(schemas, {foo: {}})
      assertValid(schemas, {foo: {bar: "string"}})
      assertInvalid(schemas, {baz: {}})
      assertInvalid(schemas, {foo: {}, baz: 1})
      assertInvalid(schemas, {foo: {baz: 1}})
      assertInvalid(schemas, {foo: {bar: "string", baz: 1}})
    })

    it("should work correctly with allOf", () => {
      const schema1 = {
        type: "object",
        allOf: [
          {
            properties: {
              x: {type: "string"},
            },
          },
        ],
        properties: {
          foo: {
            type: "object",
            properties: {
              bar: {type: "string"},
            },
          },
        },
      }

      const schemas = [schema1]
      assertValid(schemas, {})
      assertValid(schemas, {foo: {}, x: "x"})
      assertValid(schemas, {x: "x"})
      assertValid(schemas, {foo: {bar: "string"}, x: "x"})
      assertInvalid(schemas, {x: "x", baz: {}})
      assertInvalid(schemas, {foo: {}, baz: 1})
      assertInvalid(schemas, {foo: {baz: 1}})
      assertInvalid(schemas, {foo: {bar: "string", baz: 1}})
    })

    it("should work correctly with allOf with explicit unevaluatedProperties:false", () => {
      const schema1 = {
        type: "object",
        allOf: [
          {
            properties: {
              x: {type: "string"},
            },
            unevaluatedProperties: false,
          },
        ],
        properties: {
          foo: {
            type: "object",
            properties: {
              bar: {type: "string"},
            },
          },
        },
      }

      const schemas = [schema1]
      assertValid(schemas, {})
      assertValid(schemas, {x: "x"})
      assertInvalid(schemas, {foo: {}, x: "x"})
      assertInvalid(schemas, {foo: {bar: "string"}, x: "x"})
      assertInvalid(schemas, {x: "x", baz: {}})
      assertInvalid(schemas, {foo: {}, baz: 1})
      assertInvalid(schemas, {foo: {baz: 1}})
      assertInvalid(schemas, {foo: {bar: "string", baz: 1}})
    })

    it("should work correctly with nested allOf", () => {
      const schema1 = {
        type: "object",
        allOf: [
          {
            allOf: [
              {
                properties: {
                  y: {type: "string"},
                },
              },
            ],
            properties: {
              x: {type: "string"},
            },
          },
        ],
        properties: {
          foo: {
            type: "object",
            properties: {
              bar: {type: "string"},
            },
          },
        },
      }

      const schemas = [schema1]
      assertValid(schemas, {})
      assertValid(schemas, {x: "x"})
      assertValid(schemas, {foo: {}, x: "x"})
      assertValid(schemas, {foo: {bar: "string"}, x: "x"})
      assertValid(schemas, {x: "x", y: "y"})
      assertValid(schemas, {foo: {}, x: "x", y: "y"})
      assertValid(schemas, {foo: {bar: "string"}, x: "x", y: "y"})
      assertInvalid(schemas, {x: "x", baz: {}})
      assertInvalid(schemas, {foo: {}, baz: 1})
      assertInvalid(schemas, {foo: {baz: 1}})
      assertInvalid(schemas, {foo: {bar: "string", baz: 1}})
    })
  })

  describe("validation with $refs", () => {
    it("should work for simple $ref", () => {
      const schema1 = {
        type: "object",
        properties: {
          foo: {
            $ref: "#/definitions/foo",
          },
        },
        definitions: {
          foo: {
            type: "object",
            properties: {
              bar: {type: "string"},
            },
          },
        },
      }

      const schemas = [schema1]
      assertValid(schemas, {})
      assertValid(schemas, {foo: {}})
      assertValid(schemas, {foo: {bar: "string"}})
      assertInvalid(schemas, {baz: {}})
      assertInvalid(schemas, {foo: {}, baz: 1})
      assertInvalid(schemas, {foo: {baz: 1}})
      assertInvalid(schemas, {foo: {bar: "string", baz: 1}})
    })

    it("should work correctly with allOf and $ref", () => {
      const schema1 = {
        type: "object",
        allOf: [
          {
            $ref: "#/definitions/x",
          },
        ],
        properties: {
          foo: {
            $ref: "#/definitions/x",
          },
        },
        definitions: {
          x: {
            type: "object",
            properties: {
              x: {type: "string"},
            },
          },
        },
      }

      const schemas = [schema1]
      assertValid(schemas, {})
      assertValid(schemas, {foo: {}, x: "x"})
      assertValid(schemas, {x: "x"})
      assertValid(schemas, {foo: {x: "string"}, x: "x"})
      assertInvalid(schemas, {x: "x", baz: {}})
      assertInvalid(schemas, {foo: {}, baz: 1})
      assertInvalid(schemas, {foo: {baz: 1}})
      assertInvalid(schemas, {foo: {x: "string", baz: 1}})
    })

    it("should work correctly with allOf and $ref with nested schemas", () => {
      const schema1 = {
        type: "object",
        allOf: [
          {
            $ref: "#/definitions/x",
          },
        ],
        properties: {
          foo: {
            type: "object",
            properties: {
              bar: {type: "string"},
            },
          },
        },
        definitions: {
          x: {
            properties: {
              x: {type: "string"},
              y: {type: "object", properties: {}},
            },
          },
        },
      }

      const schemas = [schema1]
      assertValid(schemas, {})
      assertValid(schemas, {x: "x", y: {}})
      assertValid(schemas, {x: "x", y: {}})
      assertValid(schemas, {foo: {bar: "string"}, x: "x", y: {}})
      assertInvalid(schemas, {x: "x", baz: {}})
      assertInvalid(schemas, {foo: {}, baz: 1})
      assertInvalid(schemas, {foo: {baz: 1}})
      assertInvalid(schemas, {foo: {bar: "string", baz: 1}})
      assertInvalid(schemas, {foo: {bar: "string", y: {a: 1}}})
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
})
