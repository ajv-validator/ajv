import _Ajv from "../ajv"
import {KeywordDefinition, SchemaValidateFunction} from "../../dist/types"
import chai from "../chai"
chai.should()

describe("issue #181, user-defined keyword is not validated in allErrors mode if there were previous error", () => {
  it("should validate user-defined keyword that doesn't create errors", () => {
    testKeywordErrors({
      keyword: "alwaysFails",
      type: "object",
      errors: true,
      validate: function v(/* value */) {
        return false
      },
    })
  })

  it("should validate keyword that creates errors", () => {
    const validate: SchemaValidateFunction = (/* value */) => {
      validate.errors = validate.errors || []
      validate.errors.push({
        keyword: "alwaysFails",
        message: "alwaysFails error",
        params: {
          keyword: "alwaysFails",
        },
      })
      return false
    }

    testKeywordErrors({
      keyword: "alwaysFails",
      type: "object",
      errors: true,
      validate,
    })
  })

  function testKeywordErrors(def: KeywordDefinition): void {
    const ajv = new _Ajv({allErrors: true})

    ajv.addKeyword(def)

    const schema = {
      type: "object",
      required: ["foo"],
      alwaysFails: true,
    }

    const validate: any = ajv.compile(schema)

    validate({foo: 1}).should.equal(false)
    validate.errors.should.have.length(1)
    validate.errors[0].keyword.should.equal("alwaysFails")

    validate({}).should.equal(false)
    validate.errors.should.have.length(2)
    validate.errors[0].keyword.should.equal("required")
    validate.errors[1].keyword.should.equal("alwaysFails")
  }
})
