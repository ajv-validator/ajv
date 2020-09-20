import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("strictTypes option", () => {
  const ajv = new _Ajv({strictTypes: true})

  describe("propertyNames", () => {
    it('should set default data type "string"', () => {
      ajv.compile({
        type: "object",
        propertyNames: {maxLength: 5},
      })

      ajv.compile({
        type: "object",
        propertyNames: {type: "string", maxLength: 5},
      })

      should.throw(() => {
        ajv.compile({
          type: "object",
          propertyNames: {type: "number"},
        })
      }, /type "number" not allowed by context/)
    })
  })
})
