import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("issue #897: removeAdditional: 'failing' with allErrors: false", () => {
  const schema = {
    type: "object",
    properties: {
      requiredProperty: {type: "boolean"},
    },
    required: ["requiredProperty"],
    additionalProperties: {not: {}},
  }

  describe("additionalProperties as a failing schema", () => {
    it("should be invalid, remove extra property, and report required when required is missing (allErrors: false)", () => {
      const ajv = new _Ajv({removeAdditional: "failing", allErrors: false})
      const validate = ajv.compile(schema)
      const data: Record<string, unknown> = {foo: 0}

      validate(data).should.equal(false)
      data.should.eql({})
      should.exist(validate.errors)
      validate.errors.should.have.lengthOf(1)
      validate.errors[0].keyword.should.equal("required")
      validate.errors[0].params.should.have.property("missingProperty", "requiredProperty")
    })

    it("should be valid, remove extra property, and leave errors null when required is present (allErrors: false)", () => {
      const ajv = new _Ajv({removeAdditional: "failing", allErrors: false})
      const validate = ajv.compile(schema)
      const data: Record<string, unknown> = {requiredProperty: true, foo: 0}

      validate(data).should.equal(true)
      should.equal(validate.errors, null)
      data.should.eql({requiredProperty: true})
    })

    it("should be invalid, remove extra property, and report required when required is missing (allErrors: true)", () => {
      const ajv = new _Ajv({removeAdditional: "failing", allErrors: true})
      const validate = ajv.compile(schema)
      const data: Record<string, unknown> = {foo: 0}

      validate(data).should.equal(false)
      data.should.eql({})
      should.exist(validate.errors)
      validate.errors.should.have.lengthOf(1)
      validate.errors[0].keyword.should.equal("required")
    })
  })

  describe("property-count keywords after removal", () => {
    it("should fail minProperties when the only remaining properties were removed", () => {
      const ajv = new _Ajv({removeAdditional: "failing", allErrors: false})
      const validate = ajv.compile({
        type: "object",
        minProperties: 1,
        additionalProperties: {type: "string"},
      })
      const data: Record<string, unknown> = {extra: 1}

      validate(data).should.equal(false)
      data.should.eql({})
      should.exist(validate.errors)
      validate.errors[0].keyword.should.equal("minProperties")
    })

    it("should pass maxProperties after failing additional properties are removed", () => {
      const ajv = new _Ajv({removeAdditional: "failing", allErrors: false})
      const validate = ajv.compile({
        type: "object",
        maxProperties: 1,
        properties: {a: {type: "number"}},
        additionalProperties: {type: "string"},
      })
      const data: Record<string, unknown> = {a: 1, extra: 1}

      validate(data).should.equal(true)
      should.equal(validate.errors, null)
      data.should.eql({a: 1})
    })
  })

  it("should keep additional properties that pass the additionalProperties schema", () => {
    const ajv = new _Ajv({removeAdditional: "failing", allErrors: false})
    const validate = ajv.compile({
      type: "object",
      properties: {foo: {type: "string"}},
      additionalProperties: {type: "string"},
    })
    const data: Record<string, unknown> = {foo: "foo", keep: "ok", drop: 1}

    validate(data).should.equal(true)
    should.equal(validate.errors, null)
    data.should.eql({foo: "foo", keep: "ok"})
  })
})
