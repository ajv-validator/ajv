import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

const protoProps = [
  "hasOwnProperty",
  "toString",
  "valueOf",
  "constructor",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
]

describe("schema registry keys that are Object.prototype property names", () => {
  describe("getSchema", () => {
    // getSchema reads `this.schemas[keyRef] || this.refs[keyRef]`, so this
    // exercises both registries: with plain {} objects either lookup returns an
    // inherited Object.prototype member instead of undefined and throws.
    it("should return undefined, not an inherited prototype member", () => {
      const ajv = new _Ajv()
      for (const key of protoProps) {
        ;(() => ajv.getSchema(key)).should.not.throw()
        chai.expect(ajv.getSchema(key)).to.equal(undefined)
      }
    })
  })

  describe("addSchema", () => {
    it("should not report a clash with an unused key on a fresh instance", () => {
      for (const key of protoProps) {
        const ajv = new _Ajv()
        ;(() => ajv.addSchema({type: "string"}, key)).should.not.throw()
        const validate = ajv.getSchema(key)
        chai.expect(validate).to.be.a("function")
        validate!("ok").should.equal(true)
        validate!(1).should.equal(false)
      }
    })
  })
})
