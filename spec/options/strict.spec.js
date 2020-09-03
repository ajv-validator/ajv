"use strict"

const Ajv = require("../ajv")
const should = require("../chai").should()

describe("strict option with additionalItems", () => {
  describe("strict = false", () => {
    it('should NOT throw an error or log a warning when "additionalItems" is used without "items"', () => {
      const output = {}
      const ajv = new Ajv({
        strict: false,
        logger: getLogger(output),
      })
      const schema = {
        additionalItems: false,
      }
      ajv.compile(schema)
      should.not.exist(output.warning)
    })
  })

  describe("strict = true or undefined", () => {
    it('should throw an error when "additionalItems" is used without "items"', () => {
      test(new Ajv({strict: true}))
      test(new Ajv())

      function test(ajv) {
        const schema = {
          additionalItems: false,
        }
        should.throw(() => {
          ajv.compile(schema)
        })
      }
    })
  })

  describe('strict = "log"', () => {
    it('should log a warning when "additionalItems" is used without "items"', () => {
      const output = {}
      const ajv = new Ajv({
        strict: "log",
        logger: getLogger(output),
      })
      const schema = {
        additionalItems: false,
      }
      ajv.compile(schema)
      ;/additionalItems/.test(output.warning).should.equal(true)
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
              additionalItems: false,
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
      warn(msg) {
        output.warning = msg
      },
      error() {
        throw new Error("error should not be called")
      },
    }
  }
})
