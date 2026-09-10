import _Ajv2019 from "../ajv2019"
import _Ajv2020 from "../ajv2020"
import * as assert from "assert"

describe('"if" without "then" and "else" collects annotations for unevaluated keywords', () => {
  it("can see annotations from if without then and else (items)", () => {
    const ajv = new _Ajv2020({strict: false})
    const schema = {
      if: {prefixItems: [{const: "a"}]},
      unevaluatedItems: false,
    }
    const validate = ajv.compile(schema)
    assert.strictEqual(validate(["a"]), true)
    assert.strictEqual(validate(["a", "b"]), false)
    // annotations are collected only when the instance matches "if"
    assert.strictEqual(validate(["b"]), false)
  })

  it("can see annotations from if without then and else (properties)", () => {
    const ajv = new _Ajv2020({strict: false})
    const schema = {
      if: {patternProperties: {foo: {type: "string"}}},
      unevaluatedProperties: false,
    }
    const validate = ajv.compile(schema)
    assert.strictEqual(validate({foo: "a"}), true)
    assert.strictEqual(validate({bar: 2}), false)
    assert.strictEqual(validate({foo: 1}), false)
  })

  it("can see annotations from if without then and else (draft2019, items)", () => {
    const ajv = new _Ajv2019({strict: false})
    const schema = {
      if: {items: [{const: "a"}]},
      unevaluatedItems: false,
    }
    const validate = ajv.compile(schema)
    assert.strictEqual(validate(["a"]), true)
    assert.strictEqual(validate(["a", "b"]), false)
  })

  it("can see annotations from if without then and else (draft2019, properties)", () => {
    const ajv = new _Ajv2019({strict: false})
    const schema = {
      if: {patternProperties: {foo: {type: "string"}}},
      unevaluatedProperties: false,
    }
    const validate = ajv.compile(schema)
    assert.strictEqual(validate({foo: "a"}), true)
    assert.strictEqual(validate({bar: 2}), false)
  })
})
