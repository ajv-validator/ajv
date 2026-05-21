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
    it("should resolve dynamicRef to a nested dynamicAnchor in the same schema resource", () => {
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

      const ajv = new _Ajv2020({strict: false})
      const validate = ajv.compile(schema)

      assert.strictEqual(validate({schema: {type: "string"}}), true)
      assert.strictEqual(validate({schema: "string"}), false)
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
