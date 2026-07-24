import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("issue #1068: URI host names should be case-insensitive", () => {
  const schema = {
    $id: "http://Test.com/Schemas/testSchema.json",
    type: "object",
    properties: {
      value: {type: "string"},
    },
  }

  for (const ref of [
    "http://Test.com/Schemas/testSchema.json",
    "http://test.com/Schemas/testSchema.json",
  ]) {
    it(`should resolve ${ref}`, () => {
      const ajv = new _Ajv()
      ajv.addSchema(schema)
      const validate = ajv.compile({$ref: ref})

      validate({value: "valid"}).should.equal(true)
      validate({value: 1}).should.equal(false)
    })
  }

  it("should keep URI paths case-sensitive", () => {
    const ajv = new _Ajv()
    ajv.addSchema(schema)
    should.throw(
      () => ajv.compile({$ref: "http://test.com/schemas/testSchema.json"}),
      /can't resolve reference/
    )
  })

  it("should normalize schema lookup and removal keys", () => {
    const ajv = new _Ajv()
    ajv.addSchema(schema)

    should.equal(typeof ajv.getSchema("http://test.com/Schemas/testSchema.json"), "function")
    ajv.removeSchema("http://TEST.com/Schemas/testSchema.json")
    should.equal(ajv.getSchema(schema.$id), undefined)
  })
})
