import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("options to add schemas", () => {
  describe("schemas", () => {
    it("should add schemas from object", () => {
      const ajv = new _Ajv({
        schemas: {
          int: {type: "integer"},
          str: {type: "string"},
        },
      })

      ajv.validate("int", 123).should.equal(true)
      ajv.validate("int", "foo").should.equal(false)
      ajv.validate("str", "foo").should.equal(true)
      ajv.validate("str", 123).should.equal(false)
    })

    it("should add schemas from array", () => {
      const ajv = new _Ajv({
        schemas: [
          {$id: "int", type: "integer"},
          {$id: "str", type: "string"},
          {
            $id: "obj",
            type: "object",
            properties: {
              int: {$ref: "int"},
              str: {$ref: "str"},
            },
          },
        ],
      })

      ajv.validate("obj", {int: 123, str: "foo"}).should.equal(true)
      ajv.validate("obj", {int: "foo", str: "bar"}).should.equal(false)
      ajv.validate("obj", {int: 123, str: 456}).should.equal(false)
    })
  })

  describe("addUsedSchema", () => {
    ;[true, undefined].forEach((optionValue) => {
      describe("= " + optionValue, () => {
        let ajv

        beforeEach(() => {
          ajv = new _Ajv({addUsedSchema: optionValue})
        })

        describe("compile and validate", () => {
          it("should add schema", () => {
            let schema = {$id: "str", type: "string"}
            const validate = ajv.compile(schema)
            validate("abc").should.equal(true)
            validate(1).should.equal(false)
            ajv.getSchema("str").should.equal(validate)

            schema = {$id: "int", type: "integer"}
            ajv.validate(schema, 1).should.equal(true)
            ajv.validate(schema, "abc").should.equal(false)
            ajv.getSchema("int").should.be.a("function")
          })

          it("should throw with duplicate ID", () => {
            ajv.compile({$id: "str", type: "string"})
            should.throw(() => {
              ajv.compile({$id: "str", type: "string", minLength: 2})
            }, /already exists/)

            const schema = {$id: "int", type: "integer"}
            const schema2 = {$id: "int", type: "integer", minimum: 0}
            ajv.validate(schema, 1).should.equal(true)
            should.throw(() => {
              ajv.validate(schema2, 1)
            }, /already exists/)
          })
        })
      })
    })

    describe("= false", () => {
      let ajv

      beforeEach(() => {
        ajv = new _Ajv({addUsedSchema: false})
      })

      describe("compile and validate", () => {
        it("should NOT add schema", () => {
          let schema = {$id: "str", type: "string"}
          const validate = ajv.compile(schema)
          validate("abc").should.equal(true)
          validate(1).should.equal(false)
          should.equal(ajv.getSchema("str"), undefined)

          schema = {$id: "int", type: "integer"}
          ajv.validate(schema, 1).should.equal(true)
          ajv.validate(schema, "abc").should.equal(false)
          should.equal(ajv.getSchema("int"), undefined)
        })

        it("should NOT throw with duplicate ID", () => {
          ajv.compile({$id: "str", type: "string"})
          should.not.throw(() => {
            ajv.compile({$id: "str", type: "string", minLength: 2})
          })

          const schema = {$id: "int", type: "integer"}
          const schema2 = {$id: "int", type: "integer", minimum: 0}
          ajv.validate(schema, 1).should.equal(true)
          should.not.throw(() => {
            ajv.validate(schema2, 1).should.equal(true)
          })
        })
      })
    })
  })
})
