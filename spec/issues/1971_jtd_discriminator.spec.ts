import _Ajv from "../ajv_jtd"
import * as assert from "assert"

describe("JTD discriminator with more than 8 (hardcoded in properties.ts) properties (issue #1971)", () => {
  const ajv = new _Ajv()

  it("should correctly validate empty values form", () => {
    const schema = {
      discriminator: "tag",
      mapping: {
        manual: {
          properties: {
            first: {type: "uint16"},
            second: {type: "uint16"},
            third: {type: "uint16"},
            fourth: {type: "uint16"},
            fifth: {type: "uint16"},
            sixth: {type: "uint16"},
            additionalOne: {type: "uint16"},
            additionalTwo: {type: "uint16"},
          },
        },
        auto: {
          properties: {
            first: {type: "uint16"},
            second: {type: "uint16"},
            third: {type: "uint16"},
            fourth: {type: "uint16"},
            fifth: {type: "uint16"},
            sixth: {type: "uint16"},
            additionalThree: {type: "uint16"},
          },
        },
      },
    }
    const data1 = {
      tag: "manual",
      first: 1,
      second: 1,
      third: 1,
      fourth: 1,
      fifth: 1,
      sixth: 1,
      additionalOne: 1,
      additionalTwo: 1,
    }
    const data2 = {
      tag: "auto",
      first: 1,
      second: 1,
      third: 1,
      fourth: 1,
      fifth: 1,
      sixth: 1,
      additionalThree: 1,
    }
    const validate = ajv.compile(schema)
    assert.strictEqual(validate(data1), true)
    assert.strictEqual(validate(data2), true)
  })
})
