import {DefinedError} from "../.."
import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("error object parameters type", () => {
  const ajv = new _Ajv({allErrors: true})

  it("should be determined by the keyword", () => {
    const validate = ajv.compile({type: "number", minimum: 0, multipleOf: 2})
    const valid = validate(-1)
    valid.should.equal(false)
    const errs = validate.errors
    if (errs) {
      errs.length.should.equal(2)
      for (const err of errs as DefinedError[]) {
        switch (err.keyword) {
          case "minimum":
            err.params.limit.should.equal(0)
            err.params.comparison.should.equal(">=")
            break
          case "multipleOf":
            err.params.multipleOf.should.equal(2)
            break
          default:
            should.fail()
        }
      }
    }
  })
})
