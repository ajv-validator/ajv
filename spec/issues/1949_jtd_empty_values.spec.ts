import _Ajv from "../ajv_jtd"
import * as assert from "assert"

describe("JTD values with empty schema (issue #1949)", () => {
  const ajv = new _Ajv()

  it("should correctly validate empty values form", () => {
    const schema = {values: {}}
    const validate = ajv.compile(schema)
    assert.strictEqual(validate({prop1: 1, prop2: 2}), true)
    assert.strictEqual(validate({}), true)
    assert.strictEqual(validate(null), false)
    assert.strictEqual(validate(1), false)
    assert.strictEqual(validate("foo"), false)
    assert.strictEqual(validate(undefined), false)
  })

  it("should correctly validate nullable empty values form", () => {
    const schema = {values: {}, nullable: true}
    const validate = ajv.compile(schema)
    assert.strictEqual(validate({prop1: 1, prop2: 2}), true)
    assert.strictEqual(validate({}), true)
    assert.strictEqual(validate(null), true)
    assert.strictEqual(validate(1), false)
    assert.strictEqual(validate("foo"), false)
    assert.strictEqual(validate(undefined), false)
  })
})
