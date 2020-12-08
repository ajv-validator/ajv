import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("issue #182, NaN validation", () => {
  const ajv = new _Ajv({strictTypes: false})

  it("should pass minimum/maximum validation without type", () => {
    testNaN(ajv, {minimum: 1}, true)
    testNaN(ajv, {maximum: 1}, true)
  })

  it("should NOT pass minimum/maximum validation without type when strict: false", () => {
    const _ajv = new _Ajv({strict: false})
    testNaN(_ajv, {minimum: 1}, false)
    testNaN(_ajv, {maximum: 1}, false)
  })

  it("should not pass minimum/maximum validation with type", () => {
    testNaN(ajv, {type: "number", minimum: 1}, false)
    testNaN(ajv, {type: "number", maximum: 1}, false)
  })

  it("should pass type: number validation when strict: false", () => {
    const _ajv = new _Ajv({strict: false})
    testNaN(_ajv, {type: "number"}, true)
  })

  it("should not pass type: number validation (changed in v7 - strict by default)", () => {
    testNaN(ajv, {type: "number"}, false)
  })

  it("should not pass type: integer validation", () => {
    testNaN(ajv, {type: "integer"}, false)
  })

  function testNaN(_ajv, schema, NaNisValid) {
    const validate = _ajv.compile(schema)
    validate(NaN).should.equal(NaNisValid)
  }
})
