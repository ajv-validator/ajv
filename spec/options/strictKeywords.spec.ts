import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("strict option with keywords (replaced strictKeywords)", () => {
  describe("strict = false", () => {
    it("should NOT throw an error or log a warning given an unknown keyword", () => {
      const output: any = {}
      const ajv = new _Ajv({
        strict: false,
        logger: getLogger(output),
      })
      const schema = {
        properties: {},
        unknownKeyword: 1,
      }

      ajv.compile(schema)
      should.not.exist(output.warning)
    })
  })

  describe("strict = true or undefined", () => {
    it("should throw an error given an unknown keyword in the schema root when strict is true", () => {
      test(new _Ajv({strict: true}))
      test(new _Ajv())

      function test(ajv) {
        const schema = {
          type: "object",
          properties: {},
          unknownKeyword: 1,
        }
        should.throw(() => ajv.compile(schema), /unknown keyword/)
      }
    })
  })

  describe('strict = "log"', () => {
    it("should log an error given an unknown keyword in the schema root", () => {
      const output: any = {}
      const ajv = new _Ajv({
        strict: "log",
        logger: getLogger(output),
      })
      const schema = {
        type: "object",
        properties: {},
        unknownKeyword: 1,
      }
      ajv.compile(schema)
      output.warning.should.match(/unknown keyword: "unknownKeyword"/)
    })
  })

  describe("unknown keyword inside schema that has no known keyword in compound keyword", () => {
    it("should throw an error given an unknown keyword when strict is true or undefined", () => {
      test(new _Ajv({strict: true}))
      test(new _Ajv())

      function test(ajv) {
        const schema = {
          anyOf: [{unknownKeyword: 1}],
        }
        should.throw(() => ajv.compile(schema), /unknown keyword/)
      }
    })
  })

  describe("custom annotations", () => {
    it('should throw an error for "x-" prefixed keywords by default', () => {
      const ajv = new _Ajv()
      should.throw(() => ajv.compile({"x-annotation": 1}), /unknown keyword: "x-annotation"/)
    })

    it('should allow ignored "x-" prefixed keywords when enabled', () => {
      const ajv = new _Ajv()
      const result = ajv.allowCustomAnnotations()
      result.should.equal(ajv)

      const validate = ajv.compile({
        type: "object",
        "x-root": 1,
        properties: {
          foo: {
            type: "string",
            "x-property": {description: "ignored"},
          },
        },
        anyOf: [{"x-sub-schema": true}],
      })

      validate({foo: "bar"}).should.equal(true)
    })

    it("should still throw an error for other unknown keywords", () => {
      const ajv = new _Ajv()
      ajv.allowCustomAnnotations()

      should.throw(
        () => ajv.compile({type: "object", "x-annotation": 1, unknownKeyword: 1}),
        /unknown keyword: "unknownKeyword"/
      )
    })

    it('should not log a warning for "x-" prefixed keywords when enabled', () => {
      const output: any = {}
      const ajv = new _Ajv({
        strict: "log",
        logger: getLogger(output),
      })
      ajv.allowCustomAnnotations()

      ajv.compile({"x-annotation": 1})

      should.not.exist(output.warning)
    })
  })

  function getLogger(output) {
    return {
      log() {
        throw new Error("log should not be called")
      },
      warn(msg) {
        output.warning = msg
      },
      error() {
        throw new Error("warn should not be called")
      },
    }
  }
})
