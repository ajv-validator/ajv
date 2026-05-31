import _Ajv from "../ajv_jtd"
import * as assert from "assert"

describe("JTD discriminator with empty properties (issue #2609)", () => {
  const ajv = new _Ajv()

  it("should compile and parse discriminator mappings with empty properties", () => {
    const schema = {
      discriminator: "t",
      mapping: {
        a: {
          properties: {},
        },
        b: {
          properties: {
            b: {type: "int32"},
          },
        },
      },
    }

    const parse = ajv.compileParser(schema)
    assert.deepStrictEqual(parse('{"t":"a"}'), {t: "a"})
    assert.deepStrictEqual(parse('{"t":"b","b":1}'), {t: "b", b: 1})
    assert.strictEqual(parse('{"t":"a","b":1}'), undefined)
  })
})
