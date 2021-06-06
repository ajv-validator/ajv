import _Ajv from "../ajv2020"
import * as assert from "assert"

describe("tracking evaluated properties with pattern properties of schema = true", () => {
  it("should initialize evaluated properties", () => {
    const ajv = new _Ajv()

    const schema = {
      type: "object",
      patternProperties: {
        "^x-": true,
      },
      unevaluatedProperties: false,
    }

    const validate = ajv.compile(schema)
    assert.strictEqual(validate({bar: 1}), false)
    assert.strictEqual(validate({"x-bar": false}), true)
  })
})
