import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("issue #2578, undefined values in schemas should be ignored", () => {
  it("should ignore undefined properties in schema", () => {
    const ajv = new _Ajv({strictSchema: false, validateSchema: false})
    const schema = {
      type: "object",
      properties: {
        foo: {type: "string"},
        bar: undefined,
      },
    }
    const data = {foo: "FOO"}
    const valid = ajv.validate(schema, data)
    valid.should.equal(true)
  })

  it("should still validate defined properties when undefined properties exist", () => {
    const ajv = new _Ajv({strictSchema: false, validateSchema: false})
    const schema = {
      type: "object",
      properties: {
        foo: {type: "string"},
        bar: undefined,
        baz: {type: "number"},
      },
    }
    
    // Valid data
    const data1 = {foo: "FOO", baz: 42}
    const valid1 = ajv.validate(schema, data1)
    valid1.should.equal(true)
    
    // Invalid data (wrong type for foo)
    const data2: any = {foo: 123, baz: 42}
    const valid2 = ajv.validate(schema, data2)
    valid2.should.equal(false)
    chai.should().exist(ajv.errors)
    ajv.errors?.should.have.length(1)
    ajv.errors?.[0].should.have.property("keyword", "type")
    ajv.errors?.[0].should.have.property("instancePath", "/foo")
  })

  it("should handle multiple undefined properties", () => {
    const ajv = new _Ajv({strictSchema: false, validateSchema: false})
    const schema = {
      type: "object",
      properties: {
        a: undefined,
        b: {type: "string"},
        c: undefined,
        d: {type: "number"},
        e: undefined,
      },
    }
    const data = {b: "test", d: 99}
    const valid = ajv.validate(schema, data)
    valid.should.equal(true)
  })

  it("should handle undefined properties from destructuring", () => {
    const ajv = new _Ajv({strictSchema: false, validateSchema: false})
    // Simulating a common scenario where properties come from destructuring
    const optionalProp: any = (undefined as any)
    const schema = {
      type: "object",
      properties: {
        name: {type: "string"},
        age: {type: "number"},
        optional: optionalProp, // undefined
      },
    }
    const data = {name: "John", age: 30}
    const valid = ajv.validate(schema, data)
    valid.should.equal(true)
  })
})
