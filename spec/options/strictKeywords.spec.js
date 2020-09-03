"use strict"

var Ajv = require("../ajv")
var should = require("../chai").should()

describe("strict option with keywords (replaced strictKeywords)", () => {
  describe("strict = false", () => {
    it("should NOT throw an error or log a warning given an unknown keyword", () => {
      var output = {}
      var ajv = new Ajv({
        strict: false,
        logger: getLogger(output),
      })
      var schema = {
        properties: {},
        unknownKeyword: 1,
      }

      ajv.compile(schema)
      should.not.exist(output.error)
    })
  })

  describe("strict = true or undefined", () => {
    it("should throw an error given an unknown keyword in the schema root when strict is true", () => {
      test(new Ajv({strict: true}))
      test(new Ajv())

      function test(ajv) {
        const schema = {
          properties: {},
          unknownKeyword: 1,
        }
        should.throw(() => {
          ajv.compile(schema)
        })
      }
    })
  })

  describe('strict = "log"', () => {
    it('should log a warning given an unknown keyword in the schema root when strict is "log"', () => {
      var output = {}
      var ajv = new Ajv({
        strict: "log",
        logger: getLogger(output),
      })
      var schema = {
        properties: {},
        unknownKeyword: 1,
      }
      ajv.compile(schema)
      should.equal(output.error, 'unknown keyword: "unknownKeyword"')
    })
  })

  describe("unknown keyword inside schema that has no known keyword in compound keyword", () => {
    it("should throw an error given an unknown keyword when strict is true or undefined", () => {
      test(new Ajv({strict: true}))
      test(new Ajv())

      function test(ajv) {
        const schema = {
          anyOf: [
            {
              unknownKeyword: 1,
            },
          ],
        }
        should.throw(() => {
          ajv.compile(schema)
        })
      }
    })
  })

  function getLogger(output) {
    return {
      log() {
        throw new Error("log should not be called")
      },
      warn() {
        throw new Error("warn should not be called")
      },
      error(msg) {
        output.error = msg
      },
    }
  }
})
