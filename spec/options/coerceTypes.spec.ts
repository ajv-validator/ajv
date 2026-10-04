import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("coerceTypes option", () => {
  describe("coerceTypes with not keyword", () => {
    it("should not coerce types or mutate data inside not keyword (issue #2673)", () => {
      const ajv = new _Ajv({coerceTypes: true})
      const schema = {
        type: "object",
        properties: {
          foo: {
            not: {
              type: "string",
            },
          },
        },
      }

      const validate = ajv.compile(schema)

      const data1 = {foo: 123}
      validate(data1).should.equal(true)
      should.not.exist(validate.errors)
      data1.should.eql({foo: 123})
      data1.foo.should.equal(123)

      const data2 = {foo: true}
      validate(data2).should.equal(true)
      should.not.exist(validate.errors)
      data2.should.eql({foo: true})
      data2.foo.should.equal(true)

      const data3 = {foo: "hello"}
      validate(data3).should.equal(false)
      validate.errors?.length.should.equal(1)
      validate.errors?.[0].keyword.should.equal("not")
      data3.should.eql({foo: "hello"})

      const data4 = {foo: null}
      validate(data4).should.equal(true)
      should.not.exist(validate.errors)
      data4.should.eql({foo: null})
    })

    it("should not coerce types inside nested subschemas in not keyword", () => {
      const ajv = new _Ajv({coerceTypes: true})
      const schema = {
        type: "object",
        properties: {
          foo: {
            not: {
              anyOf: [{type: "string"}, {type: "boolean"}],
            },
          },
        },
      }

      const validate = ajv.compile(schema)

      const data1 = {foo: 123}
      validate(data1).should.equal(true)
      should.not.exist(validate.errors)
      data1.foo.should.equal(123)

      const data2 = {foo: "hello"}
      validate(data2).should.equal(false)
      data2.foo.should.equal("hello")

      const data3 = {foo: false}
      validate(data3).should.equal(false)
      data3.foo.should.equal(false)
    })

    it("should still coerce types outside not while preventing coercion inside not", () => {
      const ajv = new _Ajv({coerceTypes: true})
      const schema = {
        type: "object",
        properties: {
          bar: {type: "string"},
          foo: {
            not: {type: "string"},
          },
        },
      }

      const validate = ajv.compile(schema)

      const data = {bar: 456, foo: 123}
      validate(data).should.equal(true)
      should.not.exist(validate.errors)
      data.bar.should.equal("456")
      data.foo.should.equal(123)
    })

    it("should not coerce scalar to array inside not when coerceTypes is 'array'", () => {
      const ajv = new _Ajv({coerceTypes: "array"})
      const schema = {
        type: "object",
        properties: {
          foo: {
            not: {
              type: "array",
              items: {type: "string"},
            },
          },
        },
      }

      const validate = ajv.compile(schema)

      const data1 = {foo: "hello"}
      validate(data1).should.equal(true)
      should.not.exist(validate.errors)
      data1.foo.should.equal("hello")

      const data2 = {foo: ["hello"]}
      validate(data2).should.equal(false)
      validate.errors?.[0].keyword.should.equal("not")
    })
  })
})
