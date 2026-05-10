import _Ajv from "../ajv2020"
import * as assert from "assert"

describe("oneOf should track evaluated properties from all branches (issue #2579)", () => {
  const ajv = new _Ajv()

  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    oneOf: [
      {
        properties: {a: {type: "string"}},
        required: ["a", "x"],
      },
      {
        properties: {b: {type: "number"}},
        required: ["b"],
      },
    ],
    unevaluatedProperties: false,
  }

  const validate = ajv.compile(schema)

  it("should accept instance where all properties are evaluated across branches", () => {
    // Subschema 0 evaluates "a" but fails (missing "x").
    // Subschema 1 evaluates "b" and passes.
    // Both "a" and "b" are evaluated, so unevaluatedProperties: false should pass.
    assert.strictEqual(validate({a: "test", b: 42}), true)
  })

  it("should reject instance with truly unevaluated properties", () => {
    assert.strictEqual(validate({b: 42, c: "extra"}), false)
  })

  it("should still require exactly one subschema to pass", () => {
    // Neither subschema passes: missing both required "x" and "b".
    assert.strictEqual(validate({a: "test"}), false)
  })

  it("should work when only the passing branch has properties", () => {
    assert.strictEqual(validate({b: 42}), true)
  })
})
