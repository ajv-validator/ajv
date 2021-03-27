import _Ajv from "../ajv2019"
import * as assert from "assert"

describe("tracking evaluated properties with nested anyOf", () => {
  it("should initialize evaluated properties", () => {
    const ajv = new _Ajv()

    const schema = {
      type: "object",
      anyOf: [
        {
          required: ["foo"],
          properties: {foo: {}},
        },
        {
          anyOf: [
            {
              properties: {bar: {}},
            },
          ],
        },
      ],
    }

    const validate = ajv.compile(schema)
    assert.strictEqual(validate({bar: 1}), true)
  })
})
