import _Ajv from "../ajv2020"
import * as assert from "assert"

describe("unevaluatedProperties with dependentSchemas", () => {
  it("should keep adjacent properties evaluated when dependency property is absent", () => {
    const ajv = new _Ajv()

    const schema = {
      type: "object",
      properties: {
        name: {type: "string"},
        link: {type: "boolean"},
      },
      required: ["name"],
      unevaluatedProperties: false,
      dependentSchemas: {
        link: {
          if: {
            properties: {
              link: {const: true},
            },
          },
          then: {
            properties: {
              originalId: {type: "string"},
            },
            required: ["originalId"],
          },
        },
      },
    }

    const validate = ajv.compile(schema)

    assert.strictEqual(validate({name: "test"}), true)
    assert.strictEqual(validate({name: "test", link: false}), true)
    assert.strictEqual(validate({name: "test", link: true, originalId: "1"}), true)
    assert.strictEqual(validate({name: "test", link: true}), false)
    assert.strictEqual(validate({name: "test", extra: 1}), false)
  })
})
