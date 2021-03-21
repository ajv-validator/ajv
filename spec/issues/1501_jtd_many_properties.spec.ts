import type Ajv from "../.."
import _Ajv from "../ajv_jtd"
import * as assert from "assert"

const PROP_COUNT = 10

describe("schema with many properties", () => {
  let ajv: Ajv
  const schema = {properties: {}}
  const data = {}
  const invalidData = {}

  before(() => {
    ajv = new _Ajv()
    for (let i = 0; i < PROP_COUNT; i++) {
      const prop = `prop${i}`
      schema.properties[prop] = {type: "uint16"}
      data[prop] = i
      invalidData[prop] = -i
    }
  })

  it("should correctly compile reference to schema", () => {
    assert.strictEqual(ajv.validate(schema, data), true)
    assert.strictEqual(ajv.validate(schema, invalidData), false)
  })
})
