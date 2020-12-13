const Ajv = require("./ajv").default
const Ajv2019 = require("./ajv2019").default
const assert = require("assert")

describe("using Ajv with javascript", () => {
  describe("draft-07", () => it("should validate", () => test(Ajv)))
  describe("draft-2019-09", () => it("should validate", () => test(Ajv2019)))

  function test(_Ajv) {
    const ajv = new _Ajv()
    const validate = ajv.compile({type: "number"})
    assert.strictEqual(validate(1), true)
    assert.strictEqual(validate("1"), false)
  }
})
