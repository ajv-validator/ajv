import _Ajv from "../ajv"
import assert = require("assert")

const schema1 = {
  $id: "one",
  type: "object",
  properties: {
    foo: {$ref: "#/definitions/foo"},
  },
  definitions: {
    foo: {$ref: "two"},
  },
}

const schema2 = {
  $id: "two",
  type: "object",
  properties: {
    bar: {$ref: "#/definitions/bar"},
  },
  definitions: {
    bar: {type: "string"},
  },
}

describe("issue 1414: base URI change", () => {
  it("should compile schema", () => {
    const ajv = new _Ajv()
    ajv.addSchema(schema2)
    const validate = ajv.compile(schema1)
    assert.strictEqual(typeof validate, "function")
    assert.strictEqual(validate({foo: {bar: 1}}), false)
    assert.strictEqual(validate({foo: {bar: "1"}}), true)
  })
})
