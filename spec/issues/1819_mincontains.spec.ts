import _Ajv from "../ajv2020"
import * as assert from "assert"

describe("`minContains: 0` without valid items (issue #1819)", () => {
  const ajv = new _Ajv()

  const schema = {
    type: "array",
    minContains: 0,
    maxContains: 1,
    contains: {type: "number"},
  }

  const validate = ajv.compile(schema)

  it("no items valid", () => assert.strictEqual(validate(["foo"]), true))
  it("1 item valid", () => assert.strictEqual(validate(["foo", 1]), true))
  it("2 items invalid", () => assert.strictEqual(validate(["foo", 1, 2]), false))
})
