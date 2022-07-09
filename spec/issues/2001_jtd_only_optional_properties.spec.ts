import type Ajv from "../.."
import _Ajv from "../ajv_jtd"
import * as assert from "assert"

const PROP_COUNT = 3

describe("schema with only optional properties", () => {
  let ajv: Ajv
  const schema = {optionalProperties: {}}
  const data = {}
  const invalidData = {}

  before(() => {
    ajv = new _Ajv()
    for (let i = 0; i < PROP_COUNT; i++) {
      const prop = `prop${i}`
      schema.optionalProperties[prop] = {type: "uint16"}
      data[prop] = i
      if (i !== 0) invalidData[prop] = i
    }
  })

  it("should correctly compile reference to schema", () => {
    assert.strictEqual(ajv.validate(schema, data), true)
    assert.strictEqual(ajv.validate(schema, invalidData), false)
  })
})