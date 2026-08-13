import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("issue #1045, properties inherited from Object.prototype are not present in data", () => {
  it("should not treat Object.prototype properties as required properties", () => {
    const ajv = new _Ajv()
    const validate = ajv.compile({type: "object", required: ["toString", "constructor"]})
    validate(JSON.parse("{}")).should.equal(false)
    validate(JSON.parse('{"toString": 1}')).should.equal(false)
    validate(JSON.parse('{"toString": 1, "constructor": 2}')).should.equal(true)
  })

  it("should not apply properties schemas to Object.prototype properties", () => {
    const ajv = new _Ajv()
    const validate = ajv.compile({
      type: "object",
      properties: {constructor: {type: "number"}},
    })
    validate(JSON.parse("{}")).should.equal(true)
    validate(JSON.parse('{"constructor": "foo"}')).should.equal(false)
    validate(JSON.parse('{"constructor": 1}')).should.equal(true)
  })

  it("should not treat Object.prototype properties as present with $data reference", () => {
    const ajv = new _Ajv({$data: true})
    const validate = ajv.compile({
      type: "object",
      properties: {req: {type: "array"}},
      required: {$data: "0/req"},
    })
    validate(JSON.parse('{"req": ["toString"]}')).should.equal(false)
    validate(JSON.parse('{"req": ["toString"], "toString": 1}')).should.equal(true)
  })

  it("should not treat Object.prototype properties as present when required is compiled into a loop", () => {
    const ajv = new _Ajv({loopRequired: 1})
    const validate = ajv.compile({type: "object", required: ["toString"]})
    validate(JSON.parse("{}")).should.equal(false)
    validate(JSON.parse('{"toString": 1}')).should.equal(true)
  })

  it("should still use inherited enumerable properties with ownProperties: false", () => {
    const ajv = new _Ajv()
    const validate = ajv.compile({
      type: "object",
      required: ["a"],
      properties: {a: {type: "number"}},
    })
    const proto = {a: 1}
    const data = Object.create(proto)
    validate(data).should.equal(true)
    proto.a = "not a number" as unknown as number
    validate(data).should.equal(false)
  })

  it("should treat other inherited properties in the same way in all modes", () => {
    class A {
      x?: number
      greet(): string {
        return "hi"
      }
    }
    const data = new A()
    data.x = 1
    const schema = {type: "object", required: ["greet", "x"]}

    new _Ajv().compile(schema)(data).should.equal(true)
    new _Ajv({loopRequired: 1}).compile(schema)(data).should.equal(true)

    const ajvData = new _Ajv({$data: true})
    const validate = ajvData.compile({
      type: "object",
      properties: {req: {type: "array"}},
      required: {$data: "0/req"},
    })
    const dataWithReq = new A() as A & {req: string[]}
    dataWithReq.x = 1
    dataWithReq.req = ["greet", "x"]
    validate(dataWithReq).should.equal(true)
  })

  it("should only use own properties with ownProperties: true", () => {
    const ajv = new _Ajv({ownProperties: true})
    const validate = ajv.compile({type: "object", required: ["a"]})
    validate(Object.create({a: 1})).should.equal(false)
    validate({a: 1}).should.equal(true)
  })
})
