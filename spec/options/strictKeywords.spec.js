"use strict"

var Ajv = require("../ajv")
var should = require("../chai").should()

describe("strictKeywords option", () => {
  describe("strictKeywords = false", () => {
    it("should NOT throw an error or log a warning given an unknown keyword", () => {
      var output = {}
      var ajv = new Ajv({
        strictKeywords: false,
        logger: getLogger(output),
      })
      var schema = {
        properties: {},
        unknownKeyword: 1,
      }

      ajv.compile(schema)
      should.not.exist(output.warning)
    })
  })

  describe("strictKeywords = true", () => {
    it("should throw an error given an unknown keyword in the schema root when strictKeywords is true", () => {
      var ajv = new Ajv({strictKeywords: true})
      var schema = {
        properties: {},
        unknownKeyword: 1,
      }
      should.throw(() => {
        ajv.compile(schema)
      })
    })
  })

  describe('strictKeywords = "log"', () => {
    it('should log a warning given an unknown keyword in the schema root when strictKeywords is "log"', () => {
      var output = {}
      var ajv = new Ajv({
        strictKeywords: "log",
        logger: getLogger(output),
      })
      var schema = {
        properties: {},
        unknownKeyword: 1,
      }
      ajv.compile(schema)
      should.equal(output.warning, 'unknown keyword: "unknownKeyword"')
    })
  })

  describe("unknown keyword inside schema that has no known keyword in compound keyword", () => {
    it("should throw an error given an unknown keyword when strictKeywords is true", () => {
      var ajv = new Ajv({strictKeywords: true})
      var schema = {
        anyOf: [
          {
            unknownKeyword: 1,
          },
        ],
      }
      should.throw(() => {
        ajv.compile(schema)
      })
    })
  })

  function getLogger(output) {
    return {
      log: () => {
        throw new Error("log should not be called")
      },
      warn: function (warning) {
        output.warning = warning
      },
      error: () => {
        throw new Error("error should not be called")
      },
    }
  }
})
