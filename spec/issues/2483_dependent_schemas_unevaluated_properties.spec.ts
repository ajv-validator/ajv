import _Ajv from "../ajv2020"
import * as assert from "assert"

describe("unevaluatedProperties with dependentSchemas (issue #2483)", () => {
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

  it("should preserve adjacent evaluated properties when dependency is absent", () => {
    assert.strictEqual(validate({name: "test"}), true)
  })

  it("should evaluate properties from an applied dependent schema", () => {
    assert.strictEqual(validate({name: "test", link: true, originalId: "1"}), true)
  })

  it("should not evaluate properties from a skipped dependent branch", () => {
    assert.strictEqual(validate({name: "test", link: false, originalId: "1"}), false)
    assert.strictEqual(validate.errors?.[0].keyword, "unevaluatedProperties")
  })
})
