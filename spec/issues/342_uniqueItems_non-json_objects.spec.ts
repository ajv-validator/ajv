import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("issue #342, support uniqueItems with some non-JSON objects", () => {
  let validate

  before(() => {
    const ajv = new _Ajv()
    validate = ajv.compile({type: "array", uniqueItems: true})
  })

  it("should allow different RegExps", () => {
    validate([/foo/, /bar/]).should.equal(true)
    validate([/foo/gi, /foo/gi]).should.equal(false)
    validate([/foo/, {}]).should.equal(true)
  })

  it("should allow different Dates", () => {
    validate([new Date("2016-11-11"), new Date("2016-11-12")]).should.equal(true)
    validate([new Date("2016-11-11"), new Date("2016-11-11")]).should.equal(false)
    validate([new Date("2016-11-11"), {}]).should.equal(true)
  })

  it("should allow undefined properties", () => {
    validate([{}, {foo: undefined}]).should.equal(true)
    validate([{foo: undefined}, {}]).should.equal(true)
    validate([{foo: undefined}, {bar: undefined}]).should.equal(true)
    validate([{foo: undefined}, {foo: undefined}]).should.equal(false)
  })
})
