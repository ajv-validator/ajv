"use strict"

var Ajv = require("../ajv")
var should = require("../chai").should()

describe("options to add schemas", () => {
  describe("schemas", () => {
    it("should add schemas from object", () => {
      var ajv = new Ajv({
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
      var ajv = new Ajv({
        schemas: [
          {$id: "int", type: "integer"},
          {$id: "str", type: "string"},
          {$id: "obj", properties: {int: {$ref: "int"}, str: {$ref: "str"}}},
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
        var ajv

        beforeEach(() => {
          ajv = new Ajv({addUsedSchema: optionValue})
        })

        describe("compile and validate", () => {
          it("should add schema", () => {
            var schema = {$id: "str", type: "string"}
            var validate = ajv.compile(schema)
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
              ajv.compile({$id: "str", minLength: 2})
            })

            var schema = {$id: "int", type: "integer"}
            var schema2 = {$id: "int", minimum: 0}
            ajv.validate(schema, 1).should.equal(true)
            should.throw(() => {
              ajv.validate(schema2, 1)
            })
          })
        })
      })
    })

    describe("= false", () => {
      var ajv

      beforeEach(() => {
        ajv = new Ajv({addUsedSchema: false})
      })

      describe("compile and validate", () => {
        it("should NOT add schema", () => {
          var schema = {$id: "str", type: "string"}
          var validate = ajv.compile(schema)
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
            ajv.compile({$id: "str", minLength: 2})
          })

          var schema = {$id: "int", type: "integer"}
          var schema2 = {$id: "int", minimum: 0}
          ajv.validate(schema, 1).should.equal(true)
          should.not.throw(() => {
            ajv.validate(schema2, 1).should.equal(true)
          })
        })
      })
    })
  })

  describe("serialize", () => {
    var serializeCalled

    it("should use custom function to serialize schema to string", () => {
      serializeCalled = undefined
      var ajv = new Ajv({serialize: serialize})
      ajv.addSchema({type: "string"})
      should.equal(serializeCalled, true)
    })

    function serialize(schema) {
      serializeCalled = true
      return JSON.stringify(schema)
    }
  })
})
