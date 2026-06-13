import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("issue #2624: deep equality crashes on objects shadowing toString/valueOf", () => {
  it("should not throw for uniqueItems when an item shadows toString with a non-function", () => {
    const ajv: any = new _Ajv()
    const validate = ajv.compile({type: "array", uniqueItems: true})
    validate([{}, {toString: ""}]).should.equal(true)
  })

  it("should not throw for enum when a value shadows valueOf with a non-function", () => {
    const ajv: any = new _Ajv()
    const validate = ajv.compile({enum: [{}, {valueOf: 0}]})
    validate({}).should.equal(true)
  })

  it("should still detect duplicates that shadow toString with equal values", () => {
    const ajv: any = new _Ajv()
    const validate = ajv.compile({type: "array", uniqueItems: true})
    validate([{toString: "x"}, {toString: "x"}]).should.equal(false)
  })
})
