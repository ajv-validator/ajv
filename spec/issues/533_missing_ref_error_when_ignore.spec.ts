import _Ajv from "../ajv"
const should = require("../chai").should()

describe('issue #533, throwing missing ref exception with option missingRefs: "ignore"', () => {
  const schema = {
    type: "object",
    properties: {
      foo: {$ref: "#/definitions/missing"},
      bar: {$ref: "#/definitions/missing"},
    },
  }

  it("should pass validation without throwing exception", () => {
    const ajv = new _Ajv({missingRefs: "ignore", logger: false})
    const validate = ajv.compile(schema)
    validate({foo: "anything"}).should.equal(true)
    validate({foo: "anything", bar: "whatever"}).should.equal(true)
  })

  it("should throw exception during schema compilation with option missingRefs: true", () => {
    const ajv = new _Ajv()
    should.throw(() => {
      ajv.compile(schema)
    })
  })
})
