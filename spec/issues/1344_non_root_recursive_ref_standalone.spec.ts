import _Ajv from "../ajv"
import standaloneCode from "../../dist/standalone"
import requireFromString = require("require-from-string")
import assert = require("assert")

const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "schema",
  $ref: "#/$defs/foo",
  $defs: {
    foo: {
      type: "object",
      properties: {
        bar: {$ref: "#/$defs/bar"},
      },
    },
    bar: {
      oneOf: [{$ref: "#/$defs/foo"}],
    },
  },
}

describe("issue #1344: non-root recursive ref with standalone code", () => {
  it("should compile to standalone code", () => {
    const ajv = new _Ajv({code: {source: true}})
    ajv.addSchema(schema)
    const validate = ajv.getSchema("schema#/$defs/foo")
    assert(typeof validate == "function")
    assert.strictEqual(validate({}), true)

    const moduleCode = standaloneCode(ajv, validate)
    const standaloneValidate = requireFromString(moduleCode)
    assert(typeof standaloneValidate == "function")
    assert.strictEqual(standaloneValidate({}), true)
  })
})
