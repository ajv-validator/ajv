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
