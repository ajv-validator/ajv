import _Ajv from "../ajv"
require("../chai").should()

describe("issue #8: schema with shared references", () => {
  it("should be supported by addSchema", spec("addSchema"))

  it("should be supported by compile", spec("compile"))

  function spec(method) {
    return () => {
      const ajv: any = new _Ajv()

      const propertySchema = {
        type: "string",
        maxLength: 4,
      }

      const schema = {
        $id: "obj.json#",
        type: "object",
        properties: {
          foo: propertySchema,
          bar: propertySchema,
        },
      }

      ajv[method](schema)

      let result = ajv.validate("obj.json#", {foo: "abc", bar: "def"})
      result.should.equal(true)

      result = ajv.validate("obj.json#", {foo: "abcde", bar: "fghg"})
      result.should.equal(false)
      ajv.errors.should.have.length(1)
    }
  }
})
