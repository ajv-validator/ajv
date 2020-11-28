import type Ajv from "../.."
import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("code generation options", () => {
  describe("sourceCode", () => {
    describe("= true", () => {
      it("should add source.code property", () => {
        test(new _Ajv({code: {source: true}}))

        function test(ajv) {
          const validate = ajv.compile({type: "number"})
          validate.source.validateCode.should.be.a("string")
        }
      })
    })

    describe("= false and default", () => {
      it("should not add source property", () => {
        test(new _Ajv())
        test(new _Ajv({code: {source: false}}))

        function test(ajv: Ajv) {
          const validate = ajv.compile({type: "number"})
          should.not.exist(validate.source)
        }
      })
    })
  })

  describe("processCode", () => {
    it("should process generated code", () => {
      const ajv = new _Ajv()
      let validate = ajv.compile({type: "string"})
      // TODO re-enable this test when option to strip whitespace is added
      // validate.toString().split("\n").length.should.equal(1)
      const unprocessedLines = validate.toString().split("\n").length

      const beautify = require("js-beautify").js_beautify
      const ajvPC = new _Ajv({code: {process: beautify}})
      validate = ajvPC.compile({type: "string"})
      validate.toString().split("\n").length.should.be.above(unprocessedLines)
      validate("foo").should.equal(true)
      validate(1).should.equal(false)
    })
  })

  describe("passContext option", () => {
    let ajv: Ajv, contexts: any[]

    beforeEach(() => {
      contexts = []
    })

    describe("= true", () => {
      it("should pass this value as context to user-defined keyword validation function", () => {
        const validate = getValidate(true)
        const self = {}
        validate.call(self, {})
        contexts.should.have.length(4)
        contexts.forEach((ctx) => ctx.should.equal(self))
      })
    })

    describe("= false", () => {
      it("should pass ajv instance as context to user-defined keyword validation function", () => {
        const validate = getValidate(false)
        const self = {}
        validate.call(self, {})
        contexts.should.have.length(4)
        contexts.forEach((ctx) => ctx.should.equal(ajv))
      })
    })

    function getValidate(passContext) {
      ajv = new _Ajv({passContext: passContext, inlineRefs: false})
      ajv.addKeyword({keyword: "testValidate", validate: storeContext})
      ajv.addKeyword({keyword: "testCompile", compile: compileTestValidate})

      const schema = {
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

    function storeContext(this: any) {
      contexts.push(this)
      return true
    }

    function compileTestValidate() {
      return storeContext
    }
  })

  describe("loopEnum option", () => {
    it("should use loop if more values than specified", () => {
      const ajv1 = new _Ajv()
      const ajv2 = new _Ajv({loopEnum: 2})
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
