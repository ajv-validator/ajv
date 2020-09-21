import _Ajv from "../ajv"
import type {Options} from "../.."
import chai from "../chai"
const should = chai.should()

describe("referenced schema options", () => {
  describe("ignoreKeywordsWithRef", () => {
    describe("= undefined", () => {
      it("should allow extending $ref with other keywords", () => {
        test({}, true)
      })

      it("should NOT log warning", () => {
        testWarning()
      })
    })

    describe("= true", () => {
      it("should ignore other keywords when $ref is used", () => {
        test({ignoreKeywordsWithRef: true, logger: false}, false)
      })

      it("should log warning when other keywords are used with $ref", () => {
        testWarning({ignoreKeywordsWithRef: true}, /keywords\signored/)
      })
    })

    function test(opts: Options, shouldExtendRef: boolean) {
      const ajv = new _Ajv(opts)
      const schema = {
        definitions: {
          int: {type: "integer"},
        },
        type: "number",
        $ref: "#/definitions/int",
        minimum: 10,
      }

      let validate = ajv.compile(schema)
      validate(10).should.equal(true)
      validate(1).should.equal(!shouldExtendRef)

      const schema1 = {
        definitions: {
          int: {type: "integer"},
        },
        type: "object",
        properties: {
          foo: {
            $ref: "#/definitions/int",
            type: "number",
            minimum: 10,
          },
          bar: {
            type: "number",
            allOf: [{$ref: "#/definitions/int"}, {minimum: 10}],
          },
        },
      }

      validate = ajv.compile(schema1)
      validate({foo: 10, bar: 10}).should.equal(true)
      validate({foo: 1, bar: 10}).should.equal(!shouldExtendRef)
      validate({foo: 10, bar: 1}).should.equal(false)
    }

    function testWarning(opts: Options = {}, msgPattern?: RegExp) {
      let oldConsole
      try {
        oldConsole = console.warn
        let consoleMsg
        console.warn = function (...args: any[]) {
          consoleMsg = Array.prototype.join.call(args, " ")
        }

        const ajv = new _Ajv(opts)

        const schema = {
          definitions: {
            int: {type: "integer"},
          },
          type: "number",
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
      const ajv = new _Ajv()
      should.throw(() => {
        ajv.compile({$ref: "missing_reference"})
      }, /can't resolve reference missing_reference/)
    })
  })
})
