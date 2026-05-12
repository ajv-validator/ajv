import type Ajv from "../dist/core"
import type {SchemaObject} from ".."
import _Ajv from "./ajv2019"
import _Ajv2020 from "./ajv2020"
import getAjvInstances from "./ajv_instances"
import options from "./ajv_options"
import * as assert from "assert"

describe("recursiveRef and dynamicRef", () => {
  let ajvs: Ajv[]

  beforeEach(() => {
    ajvs = getAjvInstances(_Ajv, options)
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

      testTree(treeSchema, strictTreeSchema)
    })
  })

  describe("dynamicRef", () => {
    it("should resolve a non-root dynamicAnchor as the static target", () => {
      const schema = {
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

      ajvs.forEach((ajv) => {
        const validate = ajv.compile(schema)
        assert.strictEqual(validate({schema: {type: "string"}}), true)
        assert.strictEqual(validate({schema: true}), true)
        assert.strictEqual(validate({schema: "bad"}), false)
        assert.strictEqual(validate({other: true}), false)
      })
    })

    it("should compile and validate an OpenAPI-style dynamic meta schema", () => {
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

      getAjvInstances(_Ajv2020, options, {strict: false}).forEach((ajv) => {
        const validate = ajv.compile(schema)
        assert.strictEqual(validate({schema: {type: "string"}}), true)
        assert.strictEqual(validate({schema: false}), true)
        assert.strictEqual(validate({schema: "bad"}), false)
        assert.strictEqual(validate({schema: {type: "string"}, extra: true}), false)
      })
    })

    it("should bind dynamicRef to a dynamicAnchor in the referencing schema resource", () => {
      const schema = {
        $id: "https://example.com/test",
        $defs: {
          User: {
            type: "object",
            required: ["id", "email"],
            properties: {
              id: {type: "string"},
              email: {type: "string"},
            },
          },
          PaginatedTemplate: {
            $id: "https://example.com/schemas/PaginatedTemplate",
            $defs: {
              itemType: {
                $dynamicAnchor: "itemType",
                not: {},
              },
            },
            type: "object",
            required: ["items", "total", "page", "pageSize"],
            properties: {
              items: {
                type: "array",
                items: {$dynamicRef: "#itemType"},
              },
              total: {type: "integer", minimum: 0},
              page: {type: "integer", minimum: 1},
              pageSize: {type: "integer", minimum: 1},
            },
          },
          PaginatedUserResponse: {
            $id: "https://example.com/schemas/PaginatedUserResponse",
            $defs: {
              itemType: {
                $dynamicAnchor: "itemType",
                $ref: "https://example.com/test#/$defs/User",
              },
            },
            $ref: "https://example.com/test#/$defs/PaginatedTemplate",
          },
        },
      }

      getAjvInstances(_Ajv2020, options, {strict: false, validateFormats: false}).forEach((ajv) => {
        ajv.addSchema(schema)
        const validate = ajv.compile({
          $ref: "https://example.com/test#/$defs/PaginatedUserResponse",
        })

        assert.strictEqual(
          validate({
            items: [{id: "u1", email: "user@example.com"}],
            total: 1,
            page: 1,
            pageSize: 10,
          }),
          true
        )

        assert.strictEqual(
          validate({
            items: [{id: "u1"}],
            total: 1,
            page: 1,
            pageSize: 10,
          }),
          false
        )
        assert.strictEqual(validate.errors?.[0].keyword, "required")
      })
    })

    it("should bind dynamicRef from an inline referencing schema", () => {
      const schema = {
        $id: "https://example.com/inline-test",
        $defs: {
          User: {
            type: "object",
            required: ["id", "email"],
            properties: {
              id: {type: "string"},
              email: {type: "string"},
            },
          },
          PaginatedTemplate: {
            $id: "https://example.com/schemas/InlinePaginatedTemplate",
            $defs: {
              itemType: {
                $dynamicAnchor: "itemType",
                not: {},
              },
            },
            type: "object",
            required: ["items", "total", "page", "pageSize"],
            properties: {
              items: {
                type: "array",
                items: {$dynamicRef: "#itemType"},
              },
              total: {type: "integer", minimum: 0},
              page: {type: "integer", minimum: 1},
              pageSize: {type: "integer", minimum: 1},
            },
          },
        },
        type: "object",
        properties: {
          response: {
            $defs: {
              itemType: {
                $dynamicAnchor: "itemType",
                $ref: "#/$defs/User",
              },
            },
            $ref: "https://example.com/schemas/InlinePaginatedTemplate",
          },
        },
      }

      getAjvInstances(_Ajv2020, options, {strict: false, validateFormats: false}).forEach((ajv) => {
        const validate = ajv.compile(schema)

        assert.strictEqual(
          validate({
            response: {
              items: [{id: "u1", email: "user@example.com"}],
              total: 1,
              page: 1,
              pageSize: 10,
            },
          }),
          true
        )

        assert.strictEqual(
          validate({
            response: {
              items: [{id: "u1"}],
              total: 1,
              page: 1,
              pageSize: 10,
            },
          }),
          false
        )
        assert.strictEqual(validate.errors?.[0].keyword, "required")
      })
    })

    it("should allow extending recursive schema with dynamicRef (future draft2020)", () => {
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

      testTree(treeSchema, strictTreeSchema)
    })
  })

  function testTree(treeSchema: SchemaObject, strictTreeSchema: SchemaObject): void {
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
