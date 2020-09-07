"use strict"

const Ajv = require("../ajv")
const should = require("../chai").should()

describe("removed schemaId option", () => {
  it("should use $id and throw exception when id is used", () => {
    test(new Ajv({logger: false}))
    test(new Ajv({schemaId: "$id", logger: false}))

    function test(ajv) {
      ajv.addSchema({$id: "mySchema1", type: "string"})
      const validate = ajv.getSchema("mySchema1")
      validate("foo").should.equal(true)
      validate(1).should.equal(false)

      should.throw(() => ajv.compile({id: "mySchema2", type: "string"}))
    }
  })

  it("should use $id and ignore id when strict: false", () => {
    test(new Ajv({logger: false, strict: false}))
    test(new Ajv({schemaId: "$id", logger: false, strict: false}))

    function test(ajv) {
      ajv.addSchema({$id: "mySchema1", type: "string"})
      let validate = ajv.getSchema("mySchema1")
      validate("foo").should.equal(true)
      validate(1).should.equal(false)

      validate = ajv.compile({id: "mySchema2", type: "string"})
      should.not.exist(ajv.getSchema("mySchema2"))
    }
  })
})
