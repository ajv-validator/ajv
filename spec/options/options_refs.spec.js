"use strict"

const Ajv = require("../ajv")
const should = require("../chai").should()

describe("referenced schema options", () => {
  describe("extendRefs", () => {
    describe("= true", () => {
      it("should allow extending $ref with other keywords", () => {
        test(new Ajv({extendRefs: true}), true)
      })

      it("should NOT log warning if extendRefs is true", () => {
        testWarning(new Ajv({extendRefs: true}))
      })
    })

    describe('= "ignore" and default', () => {
      it("should ignore other keywords when $ref is used", () => {
        test(new Ajv({logger: false}))
        test(new Ajv({extendRefs: "ignore", logger: false}), false)
      })

      it("should log warning when other keywords are used with $ref", () => {
        testWarning(new Ajv(), /keywords\signored/)
        testWarning(new Ajv({extendRefs: "ignore"}), /keywords\signored/)
      })
    })

    describe('= "fail"', () => {
      it("should fail schema compilation if other keywords are used with $ref", () => {
        testFail(new Ajv({extendRefs: "fail"}))

        function testFail(ajv) {
          should.throw(() => {
            const schema = {
              definitions: {
                int: {type: "integer"},
              },
              $ref: "#/definitions/int",
              minimum: 10,
            }
            ajv.compile(schema)
          })

          should.not.throw(() => {
            const schema = {
              definitions: {
                int: {type: "integer"},
              },
              allOf: [{$ref: "#/definitions/int"}, {minimum: 10}],
            }
            ajv.compile(schema)
          })
        }
      })
    })

    function test(ajv, shouldExtendRef) {
      let schema = {
        definitions: {
          int: {type: "integer"},
        },
        $ref: "#/definitions/int",
        minimum: 10,
      }

      let validate = ajv.compile(schema)
      validate(10).should.equal(true)
      validate(1).should.equal(!shouldExtendRef)

      schema = {
        definitions: {
          int: {type: "integer"},
        },
        type: "object",
        properties: {
          foo: {
            $ref: "#/definitions/int",
            minimum: 10,
          },
          bar: {
            allOf: [{$ref: "#/definitions/int"}, {minimum: 10}],
          },
        },
      }

      validate = ajv.compile(schema)
      validate({foo: 10, bar: 10}).should.equal(true)
      validate({foo: 1, bar: 10}).should.equal(!shouldExtendRef)
      validate({foo: 10, bar: 1}).should.equal(false)
    }

    function testWarning(ajv, msgPattern) {
      let oldConsole
      try {
        oldConsole = console.warn
        let consoleMsg
        console.warn = function () {
          consoleMsg = Array.prototype.join.call(arguments, " ")
        }

        const schema = {
          definitions: {
            int: {type: "integer"},
          },
          $ref: "#/definitions/int",
          minimum: 10,
        }

        ajv.compile(schema)
        if (msgPattern) consoleMsg.should.match(msgPattern)
        else should.not.exist(consoleMsg)
      } finally {
        console.warn = oldConsole
      }
    }
  })

  describe("missingRefs", () => {
    it("should throw if ref is missing without this option", () => {
      const ajv = new Ajv()
      should.throw(() => {
        ajv.compile({$ref: "missing_reference"})
      })
    })

    it('should not throw and pass validation with missingRef == "ignore"', () => {
      testMissingRefsIgnore(new Ajv({missingRefs: "ignore", logger: false}))
      testMissingRefsIgnore(new Ajv({missingRefs: "ignore", allErrors: true, logger: false}))

      function testMissingRefsIgnore(ajv) {
        const validate = ajv.compile({$ref: "missing_reference"})
        validate({}).should.equal(true)
      }
    })

    it('should not throw and fail validation with missingRef == "fail" if the ref is used', () => {
      testMissingRefsFail(new Ajv({missingRefs: "fail", logger: false}))
      testMissingRefsFail(new Ajv({missingRefs: "fail", verbose: true, logger: false}))
      testMissingRefsFail(new Ajv({missingRefs: "fail", allErrors: true, logger: false}))
      testMissingRefsFail(
        new Ajv({missingRefs: "fail", allErrors: true, verbose: true, logger: false})
      )

      function testMissingRefsFail(ajv) {
        let validate = ajv.compile({
          anyOf: [{type: "number"}, {$ref: "missing_reference"}],
        })
        validate(123).should.equal(true)
        validate("foo").should.equal(false)

        validate = ajv.compile({$ref: "missing_reference"})
        validate({}).should.equal(false)
      }
    })
  })
})
