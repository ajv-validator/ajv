import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe.skip("issue #273, schemaPath in error in referenced schema", () => {
  it("should have canonic reference with hash after file name", () => {
    test(new _Ajv())
    test(new _Ajv({inlineRefs: false}))

    function test(ajv) {
      const schema = {
        properties: {
          a: {$ref: "int"},
        },
      }

      const referencedSchema = {
        id: "int",
        type: "integer",
      }

      ajv.addSchema(referencedSchema)
      const validate = ajv.compile(schema)

      validate({a: "foo"}).should.equal(false)
      validate.errors[0].schemaPath.should.equal("int#/type")
    }
  })
})
