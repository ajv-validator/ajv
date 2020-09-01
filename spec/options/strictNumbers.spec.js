"use strict"

var Ajv = require("../ajv")

describe("structNumbers option", () => {
  var ajv
  describe("strictNumbers default", testWithoutStrictNumbers(new Ajv()))
  describe(
    "strictNumbers = false",
    testWithoutStrictNumbers(new Ajv({strictNumbers: false}))
  )
  describe("strictNumbers = true", () => {
    beforeEach(() => {
      ajv = new Ajv({strictNumbers: true})
    })

    it("should fail validation for NaN/Infinity as type number", () => {
      var validate = ajv.compile({type: "number"})
      validate("1.1").should.equal(false)
      validate(1.1).should.equal(true)
      validate(1).should.equal(true)
      validate(NaN).should.equal(false)
      validate(Infinity).should.equal(false)
    })

    it("should fail validation for NaN as type integer", () => {
      var validate = ajv.compile({type: "integer"})
      validate("1.1").should.equal(false)
      validate(1.1).should.equal(false)
      validate(1).should.equal(true)
      validate(NaN).should.equal(false)
      validate(Infinity).should.equal(false)
    })
  })
})

function testWithoutStrictNumbers(_ajv) {
  return () => {
    it("should NOT fail validation for NaN/Infinity as type number", () => {
      var validate = _ajv.compile({type: "number"})
      validate("1.1").should.equal(false)
      validate(1.1).should.equal(true)
      validate(1).should.equal(true)
      validate(NaN).should.equal(true)
      validate(Infinity).should.equal(true)
    })

    it("should NOT fail validation for NaN/Infinity as type integer", () => {
      var validate = _ajv.compile({type: "integer"})
      validate("1.1").should.equal(false)
      validate(1.1).should.equal(false)
      validate(1).should.equal(true)
      validate(NaN).should.equal(false)
      validate(Infinity).should.equal(true)
    })
  }
}
