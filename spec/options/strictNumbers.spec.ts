import _Ajv from "../ajv"

describe("strict option with keywords (replaced structNumbers)", () => {
  describe("strict default", testStrict(new _Ajv()))
  describe("strict = true", testStrict(new _Ajv({strict: true})))
  describe('strict = "log"', testStrict(new _Ajv({strict: "log"})))
  describe("strict = false", testNotStrict(new _Ajv({strict: false})))
})

function testStrict(ajv) {
  return () => {
    it("should fail validation for NaN/Infinity as type number", () => {
      const validate = ajv.compile({type: "number"})
      validate("1.1").should.equal(false)
      validate(1.1).should.equal(true)
      validate(1).should.equal(true)
      validate(NaN).should.equal(false)
      validate(Infinity).should.equal(false)
    })

    it("should fail validation for NaN as type integer", () => {
      const validate = ajv.compile({type: "integer"})
      validate("1.1").should.equal(false)
      validate(1.1).should.equal(false)
      validate(1).should.equal(true)
      validate(NaN).should.equal(false)
      validate(Infinity).should.equal(false)
    })
  }
}

function testNotStrict(_ajv) {
  return () => {
    it("should NOT fail validation for NaN/Infinity as type number", () => {
      const validate = _ajv.compile({type: "number"})
      validate("1.1").should.equal(false)
      validate(1.1).should.equal(true)
      validate(1).should.equal(true)
      validate(NaN).should.equal(true)
      validate(Infinity).should.equal(true)
    })

    it("should NOT fail validation for NaN/Infinity as type integer", () => {
      const validate = _ajv.compile({type: "integer"})
      validate("1.1").should.equal(false)
      validate(1.1).should.equal(false)
      validate(1).should.equal(true)
      validate(NaN).should.equal(false)
      validate(Infinity).should.equal(true)
    })
  }
}
