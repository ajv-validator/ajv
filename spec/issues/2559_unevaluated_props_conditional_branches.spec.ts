import _Ajv from "../ajv2020"
import * as assert from "assert"

// Properties/items evaluated by a sibling `$ref` (i.e. tracked before a keyword with conditional
// branches runs) must stay evaluated regardless of which branch matches. Previously the statically
// tracked evaluated props were only emitted inside the first branch and were lost when a different
// branch matched, causing spurious `unevaluatedProperties`/`unevaluatedItems` failures.
// https://github.com/ajv-validator/ajv/issues/2559
describe("evaluated properties from $ref preserved across conditional branches (issue #2559)", () => {
  const ajv = new _Ajv()

  const $defs = {
    parent: {type: "object", properties: {propFromParent: true}},
  }

  it("oneOf: $ref-evaluated property is kept for every passing branch", () => {
    const validate = ajv.compile({
      type: "object",
      $ref: "#/$defs/parent",
      oneOf: [
        {type: "object", required: ["propFrom1stOneOf"], properties: {propFrom1stOneOf: true}},
        {type: "object", required: ["propFrom2ndOneOf"], properties: {propFrom2ndOneOf: true}},
      ],
      unevaluatedProperties: false,
      $defs,
    })
    assert.strictEqual(validate({propFromParent: true, propFrom1stOneOf: true}), true)
    // The 2nd branch used to drop `propFromParent`, reporting it as unevaluated.
    assert.strictEqual(validate({propFromParent: true, propFrom2ndOneOf: true}), true)
  })

  it("anyOf: $ref-evaluated property is kept for every passing branch", () => {
    const validate = ajv.compile({
      type: "object",
      $ref: "#/$defs/parent",
      anyOf: [
        {required: ["a"], properties: {a: true}},
        {required: ["b"], properties: {b: true}},
      ],
      unevaluatedProperties: false,
      $defs,
    })
    assert.strictEqual(validate({propFromParent: true, a: true}), true)
    assert.strictEqual(validate({propFromParent: true, b: true}), true)
  })

  it("dependentSchemas: $ref-evaluated property is kept when a later dependency triggers", () => {
    const validate = ajv.compile({
      type: "object",
      $ref: "#/$defs/parent",
      dependentSchemas: {
        a: {properties: {aa: true}},
        propFromParent: {properties: {depProp: true}},
      },
      unevaluatedProperties: false,
      $defs,
    })
    assert.strictEqual(validate({propFromParent: true, depProp: true}), true)
  })

  it("oneOf: items evaluated by $ref are kept for every passing branch", () => {
    const validate = new _Ajv({strict: false}).compile({
      type: "array",
      $ref: "#/$defs/tuple",
      oneOf: [{prefixItems: [{const: 1}]}, {prefixItems: [{const: 2}]}],
      unevaluatedItems: false,
      $defs: {tuple: {prefixItems: [true, true]}},
    })
    // $ref evaluates both items; the matching branch only evaluates the first.
    assert.strictEqual(validate([2, "x"]), true)
  })
})
