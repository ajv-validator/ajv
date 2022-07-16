import _Ajv from "../ajv_jtd"
import * as assert from "assert"

const PROP_COUNT = 3

describe("schema with only optional properties", () => {
  let ajv: InstanceType<typeof _Ajv>
  const schema = {optionalProperties: {}}
  const data = {}
  const invalidData = {}
  let serialize

  before(() => {
    ajv = new _Ajv()
    for (let i = 0; i < PROP_COUNT; i++) {
      const prop = `prop${i}`
      schema.optionalProperties[prop] = {type: "uint16"}
      data[prop] = i
      if (i !== 0) invalidData[prop] = i
    }
    serialize = ajv.compileSerializer(schema)
  })

  it("should correctly compile reference to schema", () => {
    assert.strictEqual(serialize(data), '{"prop0":0,"prop1":1,"prop2":2}')
    assert.strictEqual(serialize(invalidData), '{"prop1":1,"prop2":2}')
  })
})
