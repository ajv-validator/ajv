import type Ajv from "../.."
import _Ajv from "../ajv"
import assert = require("assert")
import chai from "../chai"
const should = chai.should()

describe("removed schemaId option", () => {
  it("should use $id and throw exception when id is used", () => {
    test(new _Ajv({logger: false}))

    function test(ajv) {
      ajv.addSchema({$id: "mySchema1", type: "string"})
      const validate = ajv.getSchema("mySchema1")
      validate("foo").should.equal(true)
      validate(1).should.equal(false)

      should.throw(
        () => ajv.compile({id: "mySchema2", type: "string"}),
        /NOT SUPPORTED: keyword "id"/
      )
    }
  })

  it("should use $id and throw exception for id when strict: false", () => {
    test(new _Ajv({logger: false, strict: false}))

    function test(ajv: Ajv) {
      ajv.addSchema({$id: "mySchema1", type: "string"})
      const validate = ajv.getSchema("mySchema1")
      assert(typeof validate == "function")
      validate("foo").should.equal(true)
      validate(1).should.equal(false)

      should.throw(
        () => ajv.compile({id: "mySchema2", type: "string"}),
        /NOT SUPPORTED: keyword "id"/
      )
      should.not.exist(ajv.getSchema("mySchema2"))
    }
  })
})
