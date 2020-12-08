import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("removeAdditional option", () => {
  it("should remove all additional properties", () => {
    const ajv = new _Ajv({removeAdditional: "all"})

    ajv.addSchema({
      $id: "//test/fooBar",
      type: "object",
      properties: {foo: {type: "string"}, bar: {type: "string"}},
    })

    const object = {
      foo: "foo",
      bar: "bar",
      baz: "baz-to-be-removed",
    }

    ajv.validate("//test/fooBar", object).should.equal(true)
    object.should.have.property("foo")
    object.should.have.property("bar")
    object.should.not.have.property("baz")
  })

  it("should remove properties that would error when `additionalProperties = false`", () => {
    const ajv = new _Ajv({removeAdditional: true})

    ajv.addSchema({
      $id: "//test/fooBar",
      type: "object",
      properties: {foo: {type: "string"}, bar: {type: "string"}},
      additionalProperties: false,
    })

    const object = {
      foo: "foo",
      bar: "bar",
      baz: "baz-to-be-removed",
    }

    ajv.validate("//test/fooBar", object).should.equal(true)
    object.should.have.property("foo")
    object.should.have.property("bar")
    object.should.not.have.property("baz")
  })

  it("should remove properties that would error when `additionalProperties = false` (many properties, boolean schema)", () => {
    const ajv = new _Ajv({removeAdditional: true})

    const schema = {
      type: "object",
      properties: {
        obj: {
          type: "object",
          additionalProperties: false,
          properties: {
            a: {type: "string"},
            b: false,
            c: {type: "string"},
            d: {type: "string"},
            e: {type: "string"},
            f: {type: "string"},
            g: {type: "string"},
            h: {type: "string"},
            i: {type: "string"},
          },
        },
      },
    }

    const data = {
      obj: {
        a: "valid",
        b: "should not be removed",
        additional: "will be removed",
      },
    }

    ajv.validate(schema, data).should.equal(false)
    data.should.eql({
      obj: {
        a: "valid",
        b: "should not be removed",
      },
    })
  })

  it("should remove properties that would error when `additionalProperties` is a schema", () => {
    const ajv = new _Ajv({removeAdditional: "failing"})

    ajv.addSchema({
      $id: "//test/fooBar",
      type: "object",
      properties: {foo: {type: "string"}, bar: {type: "string"}},
      additionalProperties: {type: "string"},
    })

    const object = {
      foo: "foo",
      bar: "bar",
      baz: "baz-to-be-kept",
      fizz: 1000,
    }

    ajv.validate("//test/fooBar", object).should.equal(true)
    object.should.have.property("foo")
    object.should.have.property("bar")
    object.should.have.property("baz")
    object.should.not.have.property("fizz")

    ajv.addSchema({
      $id: "//test/fooBar2",
      type: "object",
      properties: {foo: {type: "string"}, bar: {type: "string"}},
      additionalProperties: {type: "string", pattern: "^to-be-", maxLength: 10},
    })

    const object1 = {
      foo: "foo",
      bar: "bar",
      baz: "to-be-kept",
      quux: "to-be-removed",
      fizz: 1000,
    }

    ajv.validate("//test/fooBar2", object1).should.equal(true)
    object1.should.have.property("foo")
    object1.should.have.property("bar")
    object1.should.have.property("baz")
    object1.should.not.have.property("fizz")
  })
})
