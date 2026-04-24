import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("$data format with Object.prototype property names", () => {
  let validate

  beforeEach(() => {
    const ajv = new _Ajv({$data: true})
    validate = ajv.compile({
      type: "object",
      properties: {
        str: {type: "string", format: {$data: "1/strFormat"}},
        strFormat: {type: "string"},
      },
    })
  })

  it("should not throw when format name is an Object.prototype property", () => {
    const protoProps = [
      "hasOwnProperty",
      "toString",
      "valueOf",
      "constructor",
      "isPrototypeOf",
      "propertyIsEnumerable",
      "toLocaleString",
    ]

    for (const prop of protoProps) {
      ;(() => validate({str: "test", strFormat: prop})).should.not.throw()
    }
  })

  it("should fail validation when format name is an Object.prototype property", () => {
    validate({str: "test", strFormat: "hasOwnProperty"}).should.equal(false)
    validate({str: "test", strFormat: "toString"}).should.equal(false)
    validate({str: "test", strFormat: "constructor"}).should.equal(false)
  })
})
