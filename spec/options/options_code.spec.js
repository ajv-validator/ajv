"use strict"

var Ajv = require("../ajv")
var should = require("../chai").should()

describe("code generation options", () => {
  describe("sourceCode", () => {
    describe("= true", () => {
      it("should add source.code property", () => {
        test(new Ajv({sourceCode: true}))

        function test(ajv) {
          var validate = ajv.compile({type: "number"})
          validate.source.code.should.be.a("string")
        }
      })
    })

    describe("= false and default", () => {
      it("should not add source and sourceCode properties", () => {
        test(new Ajv())
        test(new Ajv({sourceCode: false}))

        function test(ajv) {
          var validate = ajv.compile({type: "number"})
          should.not.exist(validate.source)
          should.not.exist(validate.sourceCode)
        }
      })
    })
  })

  describe("processCode", () => {
    it("should process generated code", () => {
      var ajv = new Ajv()
      var validate = ajv.compile({type: "string"})
      validate.toString().split("\n").length.should.equal(1)

      var beautify = require("js-beautify").js_beautify
      var ajvPC = new Ajv({processCode: beautify})
      validate = ajvPC.compile({type: "string"})
      validate.toString().split("\n").length.should.be.above(1)
      validate("foo").should.equal(true)
      validate(1).should.equal(false)
    })
  })

  describe("passContext option", () => {
    var ajv, contexts

    beforeEach(() => {
      contexts = []
    })

    describe("= true", () => {
      it("should pass this value as context to custom keyword validation function", () => {
        var validate = getValidate(true)
        var self = {}
        validate.call(self, {})
        contexts.should.have.length(4)
        contexts.forEach((ctx) => ctx.should.equal(self))
      })
    })

    describe("= false", () => {
      it("should pass ajv instance as context to custom keyword validation function", () => {
        var validate = getValidate(false)
        var self = {}
        validate.call(self, {})
        contexts.should.have.length(4)
        contexts.forEach((ctx) => ctx.should.equal(ajv))
      })
    })

    function getValidate(passContext) {
      ajv = new Ajv({passContext: passContext, inlineRefs: false})
      ajv.addKeyword("testValidate", {validate: storeContext})
      ajv.addKeyword("testCompile", {compile: compileTestValidate})

      var schema = {
        definitions: {
          test1: {
            testValidate: true,
            testCompile: true,
          },
          test2: {
            allOf: [{$ref: "#/definitions/test1"}],
          },
        },
        allOf: [{$ref: "#/definitions/test1"}, {$ref: "#/definitions/test2"}],
      }

      return ajv.compile(schema)
    }

    function storeContext() {
      contexts.push(this)
      return true
    }

    function compileTestValidate() {
      return storeContext
    }
  })

  describe("loopEnum option", () => {
    it("should use loop if more values than specified", () => {
      const ajv1 = new Ajv()
      const ajv2 = new Ajv({loopEnum: 2})
      test(ajv1, {enum: ["foo", "bar"]})
      test(ajv2, {enum: ["foo", "bar"]})
      test(ajv1, {enum: ["foo", "bar", "baz"]})
      test(ajv2, {enum: ["foo", "bar", "baz"]})

      function test(ajv, schema) {
        ajv.validate(schema, "foo").should.equal(true)
        ajv.validate(schema, "boo").should.equal(false)
        ajv.validate(schema, 1).should.equal(false)
      }
    })
  })
})
