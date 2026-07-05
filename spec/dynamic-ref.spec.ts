import type Ajv from "../dist/core"
import type {SchemaObject} from ".."
import _Ajv from "./ajv2019"
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

    it("should not inline dynamicRef targets with numeric inlineRefs", () => {
      const treeSchema = {
        $id: "https://example.com/tree",
        $dynamicAnchor: "node",
        type: "object",
        properties: {
          children: {type: "array", items: {$dynamicRef: "#node"}},
        },
      }

      const strictTreeSchema = {
        $id: "https://example.com/strict-tree",
        $dynamicAnchor: "node",
        $ref: "tree",
        type: "object",
        unevaluatedProperties: false,
      }

      const ajv = new _Ajv({inlineRefs: 20, unevaluated: true})
      ajv.addSchema(treeSchema)
      const validate = ajv.compile(strictTreeSchema)
      assert.strictEqual(validate({children: [{extra: 1}]}), false)
    })

    it("should fail on missing non-fragment dynamicRef", () => {
      const ajv = new _Ajv()
      assert.throws(
        () => ajv.compile({$dynamicRef: "missing.json#node"}),
        /can't resolve reference missing.json#node/
      )
    })

    it("should fail on missing local dynamicRef", () => {
      const ajv = new _Ajv()
      assert.throws(
        () => ajv.compile({$dynamicRef: "#missing"}),
        /can't resolve reference #missing/
      )
    })

    it("should allow duplicate $dynamicAnchor without per-schema $id", () => {
      const ajv = new _Ajv()
      // Without the dynamic flag in addRef, addSchema throws
      // "resolves to more than one schema" because both $defs
      // declare $dynamicAnchor: "item" under the same root $id
      assert.doesNotThrow(() =>
        ajv.addSchema({
          $id: "https://example.com/dup-anchors",
          $defs: {
            a: {$dynamicAnchor: "item", type: "string"},
            b: {$dynamicAnchor: "item", type: "number"},
          },
        })
      )
    })

    it("should not skip resources with dynamic anchors in $ref resolution", () => {
      const ajv = new _Ajv({unevaluated: true})
      ajv.addSchema({
        $id: "https://example.com/template",
        $defs: {slot: {$dynamicAnchor: "slot", not: {}}},
        type: "array",
        items: {$dynamicRef: "#slot"},
      })
      const validate = ajv.compile({
        $id: "https://example.com/binder",
        $defs: {slot: {$dynamicAnchor: "slot", type: "string"}},
        $ref: "https://example.com/template",
      })
      assert.strictEqual(validate(["hello"]), true)
      assert.strictEqual(validate([42]), false)
    })

    it("should resolve dynamicRef across schemas without per-schema $id", () => {
      const ajv = new _Ajv({unevaluated: true})
      ajv.addSchema({
        $id: "https://example.com/openapi",
        $defs: {
          Paged: {
            type: "object",
            required: ["items"],
            properties: {
              items: {type: "array", items: {$dynamicRef: "#itemType"}},
            },
            $defs: {itemType: {$dynamicAnchor: "itemType", not: {}}},
          },
          UserPage: {
            allOf: [
              {$ref: "https://example.com/openapi#/$defs/Paged"},
              {$defs: {itemType: {$dynamicAnchor: "itemType", type: "string"}}},
            ],
          },
        },
      })
      const validate = ajv.compile({$ref: "https://example.com/openapi#/$defs/UserPage"})
      assert.strictEqual(validate({items: ["hello"]}), true)
      assert.strictEqual(validate({items: [42]}), false)
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
