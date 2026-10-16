import _Ajv from "../ajv"
import * as assert from "assert"

describe("issue #2077, empty string property name in required", () => {
  const ajv = new _Ajv()

  it("should fail validation when the empty string property is missing", () => {
    const validate = ajv.compile({
      type: "object",
      properties: {"": {type: "number"}},
      required: [""],
    })
    assert.strictEqual(validate({}), false)
    const error = validate.errors?.[0]
    assert.ok(error)
    assert.strictEqual(error.keyword, "required")
    assert.strictEqual((error.params as {missingProperty: string}).missingProperty, "")
    assert.strictEqual(validate({"": 1}), true)
  })

  it("should report a missing empty string property together with other properties", () => {
    const validate = ajv.compile({type: "object", required: ["foo", ""]})
    assert.strictEqual(validate({foo: 1}), false)
    const error = validate.errors?.[0]
    assert.ok(error)
    assert.strictEqual((error.params as {missingProperty: string}).missingProperty, "")
    assert.strictEqual(validate({foo: 1, "": 2}), true)
  })

  it("should fail validation with allErrors option", () => {
    const validate = new _Ajv({allErrors: true}).compile({
      type: "object",
      required: [""],
    })
    assert.strictEqual(validate({}), false)
    assert.strictEqual(validate({"": 1}), true)
  })

  it("should fail validation when a dependency on the empty string property is missing", () => {
    const validate = ajv.compile({
      type: "object",
      dependencies: {foo: [""]},
    })
    assert.strictEqual(validate({foo: 1}), false)
    assert.strictEqual(validate({foo: 1, "": 2}), true)
    assert.strictEqual(validate({}), true)
  })
})
