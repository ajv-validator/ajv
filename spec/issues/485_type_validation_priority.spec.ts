import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("issue #485, order of type validation", () => {
  it("should validate types before keywords", () => {
    const ajv = new _Ajv({allErrors: true, strictTypes: false})
    const validate: any = ajv.compile({
      type: ["integer", "string"],
      required: ["foo"],
      minimum: 2,
    })

    validate(2).should.equal(true)
    validate("foo").should.equal(true)

    validate(1.5).should.equal(false)
    checkErrors(["type", "minimum"])

    validate({}).should.equal(false)
    checkErrors(["type", "required"])

    function checkErrors(expectedErrs) {
      validate.errors.should.have.length(expectedErrs.length)
      expectedErrs.forEach((keyword, i) => validate.errors[i].keyword.should.equal(keyword))
    }
  })
})
