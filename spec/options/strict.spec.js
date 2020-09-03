"use strict"

const Ajv = require("../ajv")
const should = require("../chai").should()

describe("strict mode", () => {
  describe('"additionalItems" is used without "items"', () => {
    describe("strict = false", () => {
      it("should NOT throw an error or log a warning", () => {
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
      it("should throw an error", () => {
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
      it("should log a warning", () => {
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

    describe("inside schema that has no known keyword in compound keyword", () => {
      it("should throw an error when strict is true or undefined", () => {
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
  })

  describe('"if" without "then" and "else"', () => {
    describe("strict = false", () => {
      it("should NOT throw an error or log a warning", () => {
        const output = {}
        const ajv = new Ajv({
          strict: false,
          logger: getLogger(output),
        })
        const schema = {
          if: true,
        }
        ajv.compile(schema)
        should.not.exist(output.warning)
      })
    })

    describe("strict = true or undefined", () => {
      it("should throw an error", () => {
        test(new Ajv({strict: true}))
        test(new Ajv())

        function test(ajv) {
          const schema = {
            if: true,
          }
          should.throw(() => {
            ajv.compile(schema)
          })
        }
      })
    })

    describe('strict = "log"', () => {
      it("should log a warning", () => {
        const output = {}
        const ajv = new Ajv({
          strict: "log",
          logger: getLogger(output),
        })
        const schema = {
          if: true,
        }
        ajv.compile(schema)
        ;/if/.test(output.warning).should.equal(true)
      })
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
