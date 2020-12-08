import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("issue #204, options schemas and $data used together", () => {
  it("should use v5 metaschemas by default", () => {
    const ajv = new _Ajv({
      schemas: [{$id: "str", type: "string"}],
      $data: true,
    })

    const schema = {const: 42}
    const validate = ajv.compile(schema)

    validate(42).should.equal(true)
    validate(43).should.equal(false)

    ajv.validate("str", "foo").should.equal(true)
    ajv.validate("str", 42).should.equal(false)
  })
})
