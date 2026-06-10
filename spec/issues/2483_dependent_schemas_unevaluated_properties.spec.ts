import _Ajv from "../ajv2020"
import * as assert from "assert"

describe("issue #2483: dependentSchemas with unevaluatedProperties", () => {
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

  it("preserves evaluated properties when dependentSchemas is not applied", () => {
    const ajv = new _Ajv()
    const validate = ajv.compile(schema)

    assert.strictEqual(validate({name: "test"}), true)
  })

  it("still validates dependent schemas when the dependency property is present", () => {
    const ajv = new _Ajv()
    const validate = ajv.compile(schema)

    assert.strictEqual(validate({name: "test", link: false}), true)
    assert.strictEqual(validate({name: "test", link: true}), false)
    assert.strictEqual(validate({name: "test", link: true, originalId: "123"}), true)
  })
})
