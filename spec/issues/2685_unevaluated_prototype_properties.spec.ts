import _Ajv from "../ajv2020"
import * as assert from "assert"

describe("issue #2685, unevaluatedProperties should see prototype-named properties", () => {
  const ajv = new _Ajv()

  it("should reject them when patternProperties uses the dynamic tracker", () => {
    const validate = ajv.compile({
      type: "object",
      properties: {a: {type: "string"}},
      patternProperties: {"^x-": true},
      unevaluatedProperties: false,
    })

    assert.strictEqual(validate({a: "1", zz: "extra"}), false)
    assert.strictEqual(validate({a: "1", "x-extra": 1}), true)
    assert.strictEqual(validate({a: "1", toString: "x"}), false)
    assert.strictEqual(validate({a: "1", constructor: "x"}), false)
    assert.strictEqual(validate({a: "1", valueOf: "x"}), false)
    assert.strictEqual(validate({a: "1", hasOwnProperty: "x"}), false)
    assert.strictEqual(validate(JSON.parse('{"__proto__":{"isAdmin":true}}')), false)
    assert.strictEqual(({} as {isAdmin?: boolean}).isAdmin, undefined)
  })

  it("should reject them when anyOf merges evaluated properties", () => {
    const validate = ajv.compile({
      type: "object",
      anyOf: [{properties: {a: true}}, {properties: {b: true}}],
      unevaluatedProperties: false,
    })

    assert.strictEqual(validate({a: 1}), true)
    assert.strictEqual(validate({a: 1, toString: "x"}), false)
    assert.strictEqual(validate(JSON.parse('{"a":1,"__proto__":{"isAdmin":true}}')), false)
  })
})
