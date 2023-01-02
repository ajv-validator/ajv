import _Ajv from "../ajv_jtd"
import * as assert from "assert"

describe("JTD schema with optional/additional properties only (issue #2001)", () => {
  const ajv = new _Ajv()

  it("should correctly serialize optional properties", () => {
    const schema = {
      optionalProperties: {
        prop0: {type: "uint16"},
        prop1: {type: "uint16"},
        prop2: {type: "uint16"},
      },
      additionalProperties: true,
    }
    const serialize = ajv.compileSerializer(schema)
    const test = (data, json) => assert.strictEqual(serialize(data), json)
    test({prop0: 0, prop1: 1, prop2: 2}, '{"prop0":0,"prop1":1,"prop2":2}')
    test({prop1: 1, prop2: 2}, '{"prop1":1,"prop2":2}')
    test({prop0: 0, prop1: 1, prop2: 2, foo: "bar"}, '{"prop0":0,"prop1":1,"prop2":2,"foo":"bar"}')
    test({prop1: 1, prop2: 2, foo: "bar"}, '{"prop1":1,"prop2":2,"foo":"bar"}')
    test({foo: "bar"}, '{"foo":"bar"}')
  })
})
