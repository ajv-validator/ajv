import _AjvJTD from "./ajv_jtd"
import assert = require("assert")

describe("JTD Timestamps", () => {
  it("Should accept dates or strings by default", () => {
    const ajv = new _AjvJTD()
    const schema = {
      type: "timestamp",
    }
    assert.strictEqual(ajv.validate(schema, new Date()), true)
    assert.strictEqual(ajv.validate(schema, "2021-05-03T05:24:43.906Z"), true)
    assert.strictEqual(ajv.validate(schema, "foo"), false)
  })

  it("Should enforce timestamp=string", () => {
    const ajv = new _AjvJTD({timestamp: "string"})
    const schema = {
      type: "timestamp",
    }
    assert.strictEqual(ajv.validate(schema, new Date()), false)
    assert.strictEqual(ajv.validate(schema, "2021-05-03T05:24:43.906Z"), true)
    assert.strictEqual(ajv.validate(schema, "foo"), false)
  })

  it("Should enforce timestamp=date", () => {
    const ajv = new _AjvJTD({timestamp: "date"})
    const schema = {
      type: "timestamp",
    }
    assert.strictEqual(ajv.validate(schema, new Date()), true)
    assert.strictEqual(ajv.validate(schema, "2021-05-03T05:24:43.906Z"), false)
    assert.strictEqual(ajv.validate(schema, "foo"), false)
  })
})
