import type Ajv from "../dist/core"
import type {SchemaObject} from ".."
import _Ajv2019 from "./ajv2019"
import _Ajv2020 from "./ajv2020"
import getAjvInstances from "./ajv_instances"
import {withStandalone} from "./ajv_standalone"
import options from "./ajv_options"
import * as assert from "assert"

describe("recursiveRef and dynamicRef", () => {
  let ajvs2019: Ajv[]
  let ajvs2020: Ajv[]

  beforeEach(() => {
    ajvs2019 = getAjvInstances(_Ajv2019, options)
    ajvs2020 = getAjvInstances(_Ajv2020, options)
  })

  describe("recursiveRef", () => {
    it("should allow extending recursive schema with recursiveRef (draft2019-09)", () => {
      const treeSchema = {
        $id: "https://example.com/tree",
        $recursiveAnchor: true,
        type: "object",
        required: ["data"],
        properties: {
          data: true,
          children: {
            type: "array",
            items: {
              $recursiveRef: "#",
            },
          },
        },
      }

      const strictTreeSchema = {
        $id: "https://example.com/strict-tree",
        $recursiveAnchor: true,
        $ref: "tree",
        type: "object",
        unevaluatedProperties: false,
      }

      testTree(ajvs2019, treeSchema, strictTreeSchema)
    })

    it("should support $recursiveRef inside nested $id resource with and without $recursiveAnchor", () => {
      const schemaWithoutInnerAnchor = {
        $id: "https://example.com/rec-no-inner/base.json",
        $recursiveAnchor: true,
        anyOf: [
          {type: "boolean"},
          {
            type: "object",
            additionalProperties: {
              $id: "https://example.com/rec-no-inner/inner.json",
              anyOf: [
                {type: "integer"},
                {type: "object", additionalProperties: {$recursiveRef: "#"}},
              ],
            },
          },
        ],
      }

      const schemaWithInnerAnchor = {
        $id: "https://example.com/rec-with-inner/base.json",
        $recursiveAnchor: true,
        anyOf: [
          {type: "boolean"},
          {
            type: "object",
            additionalProperties: {
              $id: "https://example.com/rec-with-inner/inner.json",
              $recursiveAnchor: true,
              anyOf: [
                {type: "integer"},
                {type: "object", additionalProperties: {$recursiveRef: "#"}},
              ],
            },
          },
        ],
      }

      withStandalone(ajvs2019).forEach((ajv) => {
        const validateNoInner = ajv.compile(schemaWithoutInnerAnchor)
        assert.strictEqual(validateNoInner({foo: {bar: 1}}), true)
        assert.strictEqual(validateNoInner({foo: {bar: true}}), false)

        const validateWithInner = ajv.compile(schemaWithInnerAnchor)
        assert.strictEqual(validateWithInner({foo: 1}), true)
        assert.strictEqual(validateWithInner({foo: {bar: 1}}), false)
        assert.strictEqual(validateWithInner({foo: {bar: true}}), true)
        assert.strictEqual(validateWithInner({foo: {bar: {baz: 1}}}), true)
      })
    })
  })

  describe("dynamicRef", () => {
    it("should allow extending recursive schema with dynamicRef (draft2020-12)", () => {
      const treeSchema = {
        $id: "https://example.com/tree",
        $dynamicAnchor: "node",
        type: "object",
        required: ["data"],
        properties: {
          data: true,
          children: {
            type: "array",
            items: {
              $dynamicRef: "#node",
            },
          },
        },
      }

      const strictTreeSchema = {
        $id: "https://example.com/strict-tree",
        $dynamicAnchor: "node",
        $ref: "tree",
        type: "object",
        unevaluatedProperties: false,
      }

      testTree(ajvs2020, treeSchema, strictTreeSchema)
    })

    it("should resolve non-root $dynamicAnchor in $defs (issue #1745)", () => {
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {
          schema: {$dynamicRef: "#meta"},
        },
        unevaluatedProperties: false,
        $defs: {
          schema: {
            $dynamicAnchor: "meta",
            type: ["object", "boolean"],
          },
        },
      }

      withStandalone(getAjvInstances(_Ajv2020, options, {strict: false})).forEach((ajv) => {
        const validate = ajv.compile(schema)
        assert.strictEqual(validate({schema: {type: "string"}}), true)
        assert.strictEqual(validate({schema: true}), true)
        assert.strictEqual(validate({schema: "invalid"}), false)
        assert.strictEqual(validate({schema: {type: "string"}, extra: 1}), false)
      })
    })

    it("should support OpenAPI 3.1-style nested $dynamicAnchor overriding with unevaluatedProperties", () => {
      const baseSchema = {
        $id: "https://example.com/oas/schema-base",
        type: "object",
        properties: {
          openapi: {type: "string"},
          components: {
            type: "object",
            properties: {
              schemas: {
                type: "object",
                additionalProperties: {$dynamicRef: "#meta"},
              },
            },
            unevaluatedProperties: false,
          },
        },
        required: ["openapi"],
        unevaluatedProperties: false,
        $defs: {
          schema: {
            $dynamicAnchor: "meta",
            type: ["object", "boolean"],
          },
        },
      }

      const dialectSchema = {
        $id: "https://example.com/oas/schema-strict",
        $ref: "schema-base",
        $defs: {
          schema: {
            $dynamicAnchor: "meta",
            type: "object",
            properties: {
              type: {type: "string"},
              discriminator: {type: "object"},
            },
            unevaluatedProperties: false,
          },
        },
      }

      const instances = getAjvInstances(_Ajv2020, options, {strict: false})
      instances.forEach((ajv) => ajv.addSchema(baseSchema))
      withStandalone(instances).forEach((ajv) => {
        const validateBase = ajv.compile(baseSchema)
        assert.strictEqual(
          validateBase({openapi: "3.1.0", components: {schemas: {Pet: true}}}),
          true
        )
        assert.strictEqual(
          validateBase({openapi: "3.1.0", components: {schemas: {Pet: {type: "object"}}}}),
          true
        )
        assert.strictEqual(
          validateBase({openapi: "3.1.0", components: {schemas: {Pet: 42}}}),
          false
        )

        const validateDialect = ajv.compile(dialectSchema)
        assert.strictEqual(
          validateDialect({
            openapi: "3.1.0",
            components: {schemas: {Pet: {type: "object", discriminator: {}}}},
          }),
          true
        )
        assert.strictEqual(
          validateDialect({openapi: "3.1.0", components: {schemas: {Pet: true}}}),
          false
        )
        assert.strictEqual(
          validateDialect({
            openapi: "3.1.0",
            components: {schemas: {Pet: {type: "object", unknownProp: 1}}},
          }),
          false
        )
      })
    })

    it("should support generic / type-binding schema wrappers across resources", () => {
      const schema = {
        $id: "https://example.com/generics/test",
        $defs: {
          User: {
            type: "object",
            required: ["id", "email"],
            properties: {
              id: {type: "string"},
              email: {type: "string"},
            },
            additionalProperties: false,
          },
          PaginatedTemplate: {
            $id: "https://example.com/generics/PaginatedTemplate",
            type: "object",
            required: ["items"],
            properties: {
              items: {
                type: "array",
                items: {$dynamicRef: "#itemType"},
              },
            },
            $defs: {
              itemType: {
                $dynamicAnchor: "itemType",
              },
            },
          },
          PaginatedUserResponse: {
            $id: "https://example.com/generics/PaginatedUserResponse",
            $ref: "PaginatedTemplate",
            $defs: {
              itemType: {
                $dynamicAnchor: "itemType",
                $ref: "https://example.com/generics/test#/$defs/User",
              },
            },
          },
        },
        $ref: "#/$defs/PaginatedUserResponse",
      }

      const inlineWrapperSchema = {
        $id: "https://example.com/generics/inline-test",
        type: "object",
        properties: {
          users: {
            $id: "https://example.com/generics/InlineUsers",
            $ref: "PaginatedTemplate",
            $defs: {
              itemType: {
                $dynamicAnchor: "itemType",
                type: "object",
                required: ["name"],
                properties: {name: {type: "string"}},
                additionalProperties: false,
              },
            },
          },
          raw: {
            $ref: "https://example.com/generics/PaginatedTemplate",
          },
        },
        $defs: {
          PaginatedTemplate: schema.$defs.PaginatedTemplate,
        },
      }

      withStandalone(getAjvInstances(_Ajv2020, options, {strict: false})).forEach((ajv) => {
        const validate = ajv.compile(schema)
        assert.strictEqual(validate({items: [{id: "1", email: "a@b.com"}]}), true)
        assert.strictEqual(validate({items: [{id: "1"}]}), false)
        assert.strictEqual(validate({items: ["not-a-user"]}), false)

        const validateInline = ajv.compile(inlineWrapperSchema)
        assert.strictEqual(
          validateInline({users: {items: [{name: "Alice"}]}, raw: {items: [1, "anything"]}}),
          true
        )
        assert.strictEqual(validateInline({users: {items: [{wrong: 1}]}, raw: {items: [1]}}), false)
      })
    })

    it("should isolate dynamic scopes across sibling subschemas and prototype anchor names", () => {
      const schema = {
        $id: "https://example.com/scope-isolation/root",
        type: "object",
        properties: {
          scoped: {
            $id: "https://example.com/scope-isolation/scoped",
            $ref: "target",
            $defs: {
              toString: {
                $dynamicAnchor: "toString",
                type: "number",
              },
            },
          },
          unscoped: {
            $ref: "target",
          },
        },
        $defs: {
          target: {
            $id: "https://example.com/scope-isolation/target",
            $dynamicRef: "#toString",
            $defs: {
              toString: {
                $dynamicAnchor: "toString",
                type: "string",
              },
            },
          },
        },
      }

      withStandalone(getAjvInstances(_Ajv2020, options, {strict: false})).forEach((ajv) => {
        const validate = ajv.compile(schema)
        assert.strictEqual(validate({scoped: 42, unscoped: "hello"}), true)
        assert.strictEqual(validate({scoped: "hello", unscoped: "hello"}), false)
        assert.strictEqual(validate({scoped: 42, unscoped: 42}), false)
      })
    })

    it("should work with addUsedSchema: false and numeric inlineRefs", () => {
      const schema = {
        $id: "https://example.com/no-add/root",
        $dynamicAnchor: "node",
        type: "object",
        properties: {
          val: {type: "number"},
          next: {$dynamicRef: "#node"},
        },
        additionalProperties: false,
      }

      const ajv = new _Ajv2020({addUsedSchema: false, inlineRefs: 3})
      const validate = ajv.compile(schema)
      assert.strictEqual(validate({val: 1, next: {val: 2}}), true)
      assert.strictEqual(validate({val: 1, next: {val: "bad"}}), false)
    })

    it("should treat JSON pointer and non-anchor $dynamicRef as static $ref", () => {
      const schema = {
        $id: "https://example.com/pointer-dynref/root",
        $ref: "inner",
        $defs: {
          override: {
            $dynamicAnchor: "item",
            type: "number",
          },
          inner: {
            $id: "inner",
            type: "object",
            properties: {
              byPointer: {$dynamicRef: "#/$defs/item"},
              byDynamic: {$dynamicRef: "#item"},
            },
            $defs: {
              item: {
                $dynamicAnchor: "item",
                type: "string",
              },
            },
          },
        },
      }

      withStandalone(getAjvInstances(_Ajv2020, options, {strict: false})).forEach((ajv) => {
        const validate = ajv.compile(schema)
        assert.strictEqual(validate({byPointer: "str", byDynamic: 123}), true)
        assert.strictEqual(validate({byPointer: 123, byDynamic: 123}), false)
        assert.strictEqual(validate({byPointer: "str", byDynamic: "str"}), false)
      })
    })
  })

  function testTree(ajvs: Ajv[], treeSchema: SchemaObject, strictTreeSchema: SchemaObject): void {
    const validTree = {
      data: 1,
      children: [
        {
          data: 2,
          children: [{data: 3}],
        },
      ],
    }

    const invalidTree = {
      data: 1,
      children: [
        {
          data: 2,
          children: {},
        },
      ],
    }

    const treeWithExtra = {
      data: 1,
      children: [{data: 2, extra: 2}],
    }

    const treeWithDeepExtra = {
      data: 1,
      children: [
        {
          data: 2,
          children: [{data: 3, extra: 3}],
        },
      ],
    }

    ajvs.forEach((ajv) => {
      const validate = ajv.compile(treeSchema)
      assert.strictEqual(validate(validTree), true)
      assert.strictEqual(validate(invalidTree), false)
      assert.strictEqual(validate(treeWithExtra), true) // because unevaluated props allowed
      assert.strictEqual(validate(treeWithDeepExtra), true) // because unevaluated props allowed
      const validateStrict = ajv.compile(strictTreeSchema)
      assert.strictEqual(validateStrict(validTree), true)
      assert.strictEqual(validateStrict(invalidTree), false)
      assert.strictEqual(validateStrict(treeWithExtra), false) // because "extra" is "unevaluated"
      assert.strictEqual(validateStrict(treeWithDeepExtra), false) // because "extra" is "unevaluated"
    })
  }
})
