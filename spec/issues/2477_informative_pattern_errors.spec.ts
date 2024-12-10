import _Ajv from "../ajv2020"
import * as assert from "assert"

describe("Invalid regexp patterns should throw more informative errors (issue #2477)", () => {
  it("throws with pattern and schema path", () => {
    const ajv = new _Ajv()

    const rootSchema = {
      type: "string",
      pattern: "^[0-9]{2-4}",
    }

    assert.throws(
      () => ajv.compile(rootSchema),
      (thrown: Error) => thrown.message.includes("pattern ^[0-9]{2-4} at #")
    )

    const pathSchema = {
      type: "object",
      properties: {
        foo: rootSchema,
      },
    }

    assert.throws(
      () => ajv.compile(pathSchema),
      (thrown: Error) => thrown.message.includes("pattern ^[0-9]{2-4} at #/properties/foo")
    )
  })
  it("throws with pattern and schema path with $data", () => {
    const ajv = new _Ajv({$data: true})

    const schema = {
      properties: {
        shouldMatch: {},
        string: {pattern: {$data: "1/shouldMatch"}},
      },
    }
    const validate = ajv.compile(schema)

    assert.throws(
      () => ajv.compile(validate({shouldMatch: "^[0-9]{2-4}", string: "123"})),
      (thrown: Error) => thrown.message.includes("pattern ^[0-9]{2-4} at #/properties/string")
    )
  })
})
