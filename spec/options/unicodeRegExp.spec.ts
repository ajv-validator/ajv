import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("unicodeRegExp option", () => {
  const unicodeChar = "\uD83D\uDC4D"
  const unicodeSchema = {
    type: "string",
    pattern: `^[${unicodeChar}]$`,
  }

  const schemaWithEscape = {
    type: "string",
    pattern: "^[\\:]$",
  }

  const patternPropertiesSchema = {
    type: "object",
    patternProperties: {
      "^\\:.*$": {type: "number"},
    },
    additionalProperties: false,
  }

  describe("= true (default)", () => {
    const ajv = new _Ajv()
    it("should fail schema compilation if used invalid (unnecessary) escape sequence for pattern", () => {
      should.throw(() => {
        ajv.compile(schemaWithEscape)
      }, /Invalid escape/)
    })

    it("should fail schema compilation if used invalid (unnecessary) escape sequence for patternProperties", () => {
      should.throw(() => {
        ajv.compile(patternPropertiesSchema)
      }, /Invalid escape/)
    })

    it("should validate unicode character", () => {
      const validate = ajv.compile(unicodeSchema)
      validate(unicodeChar).should.equal(true)
    })
  })

  describe("= false", () => {
    const ajv = new _Ajv({unicodeRegExp: false})
    it("should pass schema compilation if used unnecessary escape sequence for pattern", () => {
      should.not.throw(() => {
        const validate = ajv.compile(schemaWithEscape)
        validate(":").should.equal(true)
      })
    })

    it("should pass schema compilation if used unnecessary escape sequence for patternProperties", () => {
      should.not.throw(() => {
        const validate = ajv.compile(patternPropertiesSchema)
        validate({":test": 1}).should.equal(true)
        validate({test: 1}).should.equal(false)
      })
    })

    it("should not validate unicode character", () => {
      const validate = ajv.compile(unicodeSchema)
      validate(unicodeChar).should.equal(false)
    })
  })
})
