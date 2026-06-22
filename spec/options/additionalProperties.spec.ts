import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("additionalProperties option", () => {
  const personSchema = {
    type: "object",
    properties: {name: {type: "string"}, email: {type: "string"}},
  }

  const matchingData = {name: "Ada", email: "ada@example.com"}
  const extraData = {...matchingData, extra: "extra"}
  const nonStringExtraData = {...matchingData, extra: 1000}

  const noKeyword = personSchema
  const additionalPropertiesAllowed = {...personSchema, additionalProperties: true}
  const additionalPropertiesForbidden = {...personSchema, additionalProperties: false}
  const additionalPropertiesString = {...personSchema, additionalProperties: {type: "string"}}

  describe('"alwaysError"', () => {
    const ajv = new _Ajv({additionalProperties: "alwaysError"})

    it("should pass validation for no additionalProperties keyword and matching data", () => {
      ajv.validate(noKeyword, matchingData).should.equal(true)
    })

    it("should fail validation for no additionalProperties keyword and extra data", () => {
      ajv.validate(noKeyword, extraData).should.equal(false)
    })

    it("should fail validation for no additionalProperties keyword and non-string extra data", () => {
      ajv.validate(noKeyword, nonStringExtraData).should.equal(false)
    })

    it("should pass validation for additionalProperties true and matching data", () => {
      ajv.validate(additionalPropertiesAllowed, matchingData).should.equal(true)
    })

    it("should fail validation for additionalProperties true and extra data", () => {
      // override schema's additionalProperties: true with alwaysError
      ajv.validate(additionalPropertiesAllowed, extraData).should.equal(false)
    })

    it("should fail validation for additionalProperties true and non-string extra data", () => {
      ajv.validate(additionalPropertiesAllowed, nonStringExtraData).should.equal(false)
    })

    it("should pass validation for additionalProperties false and matching data", () => {
      ajv.validate(additionalPropertiesForbidden, matchingData).should.equal(true)
    })

    it("should fail validation for additionalProperties false and extra data", () => {
      ajv.validate(additionalPropertiesForbidden, extraData).should.equal(false)
    })

    it("should fail validation for additionalProperties false and non-string extra data", () => {
      ajv.validate(additionalPropertiesForbidden, nonStringExtraData).should.equal(false)
    })

    it("should pass validation for additionalProperties string and matching data", () => {
      ajv.validate(additionalPropertiesString, matchingData).should.equal(true)
    })

    it("should fail validation for additionalProperties string and extra data", () => {
      // even a value that matches the additionalProperties schema is rejected
      ajv.validate(additionalPropertiesString, extraData).should.equal(false)
    })

    it("should fail validation for additionalProperties string and non-string extra data", () => {
      ajv.validate(additionalPropertiesString, nonStringExtraData).should.equal(false)
    })

    it("should report the additionalProperties validation error object", () => {
      const validate = ajv.compile(personSchema)

      validate(extraData).should.equal(false)
      const {errors} = validate
      if (!errors) throw new Error("expected errors")
      errors[0].keyword.should.equal("additionalProperties")
      errors[0].params.should.eql({additionalProperty: "extra"})
    })

    it("should not affect meta-schema validation of user schemas", () => {
      // schemas legitimately contain keywords beyond the meta-schema's properties;
      // alwaysError must be ignored when validating schemas against their meta-schema
      const compile = (): unknown => ajv.compile({...personSchema, title: "Person"})
      compile.should.not.throw()
    })
  })

  describe('"alwaysAllow"', () => {
    const ajv = new _Ajv({additionalProperties: "alwaysAllow"})

    it("should pass validation for no additionalProperties keyword and matching data", () => {
      ajv.validate(noKeyword, matchingData).should.equal(true)
    })

    it("should pass validation for no additionalProperties keyword and extra data", () => {
      ajv.validate(noKeyword, extraData).should.equal(true)
    })

    it("should pass validation for no additionalProperties keyword and non-string extra data", () => {
      ajv.validate(noKeyword, nonStringExtraData).should.equal(true)
    })

    it("should pass validation for additionalProperties true and matching data", () => {
      ajv.validate(additionalPropertiesAllowed, matchingData).should.equal(true)
    })

    it("should pass validation for additionalProperties true and extra data", () => {
      ajv.validate(additionalPropertiesAllowed, extraData).should.equal(true)
    })

    it("should pass validation for additionalProperties true and non-string extra data", () => {
      ajv.validate(additionalPropertiesAllowed, nonStringExtraData).should.equal(true)
    })

    it("should pass validation for additionalProperties false and matching data", () => {
      ajv.validate(additionalPropertiesForbidden, matchingData).should.equal(true)
    })

    it("should pass validation for additionalProperties false and extra data", () => {
      // override schema's additionalProperties: false with alwaysAllow; data is kept intact
      const object = {...extraData}
      ajv.validate(additionalPropertiesForbidden, object).should.equal(true)
      object.should.have.property("extra")
    })

    it("should pass validation for additionalProperties false and non-string extra data", () => {
      ajv.validate(additionalPropertiesForbidden, nonStringExtraData).should.equal(true)
    })

    it("should pass validation for additionalProperties string and matching data", () => {
      ajv.validate(additionalPropertiesString, matchingData).should.equal(true)
    })

    it("should pass validation for additionalProperties string and extra data", () => {
      ajv.validate(additionalPropertiesString, extraData).should.equal(true)
    })

    it("should pass validation for additionalProperties string and non-string extra data", () => {
      // even a value that does not match the additionalProperties schema is allowed (treated as `true`)
      ajv.validate(additionalPropertiesString, nonStringExtraData).should.equal(true)
    })
  })

  describe('"default" / unset', () => {
    for (const [label, ajv] of [
      ["default", new _Ajv({additionalProperties: "default"})],
      ["unset", new _Ajv({})],
    ] as const) {
      describe(label, () => {
        it("should pass validation for no additionalProperties keyword and matching data", () => {
          ajv.validate(noKeyword, matchingData).should.equal(true)
        })

        it("should pass validation for no additionalProperties keyword and extra data", () => {
          ajv.validate(noKeyword, extraData).should.equal(true)
        })

        it("should pass validation for no additionalProperties keyword and non-string extra data", () => {
          ajv.validate(noKeyword, nonStringExtraData).should.equal(true)
        })

        it("should pass validation for additionalProperties true and matching data", () => {
          ajv.validate(additionalPropertiesAllowed, matchingData).should.equal(true)
        })

        it("should pass validation for additionalProperties true and extra data", () => {
          ajv.validate(additionalPropertiesAllowed, extraData).should.equal(true)
        })

        it("should pass validation for additionalProperties true and non-string extra data", () => {
          ajv.validate(additionalPropertiesAllowed, nonStringExtraData).should.equal(true)
        })

        it("should pass validation for additionalProperties false and matching data", () => {
          ajv.validate(additionalPropertiesForbidden, matchingData).should.equal(true)
        })

        it("should fail validation for additionalProperties false and extra data", () => {
          ajv.validate(additionalPropertiesForbidden, extraData).should.equal(false)
        })

        it("should fail validation for additionalProperties false and non-string extra data", () => {
          ajv.validate(additionalPropertiesForbidden, nonStringExtraData).should.equal(false)
        })

        it("should pass validation for additionalProperties string and matching data", () => {
          ajv.validate(additionalPropertiesString, matchingData).should.equal(true)
        })

        it("should pass validation for additionalProperties string and extra data", () => {
          // extra value is a string, so it matches the additionalProperties schema
          ajv.validate(additionalPropertiesString, extraData).should.equal(true)
        })

        it("should fail validation for additionalProperties string and non-string extra data", () => {
          // extra value is not a string, so it fails the additionalProperties schema
          ajv.validate(additionalPropertiesString, nonStringExtraData).should.equal(false)
        })
      })
    }
  })

  describe("interaction with removeAdditional", () => {
    it("removeAdditional should take precedence over alwaysError for extra data", () => {
      const ajv = new _Ajv({removeAdditional: "all", additionalProperties: "alwaysError"})
      const object = {...extraData}
      ajv.validate(personSchema, object).should.equal(true)
      object.should.have.property("name")
      object.should.not.have.property("extra")
    })
  })
})
