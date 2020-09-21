import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("strict mode", () => {
  describe(
    '"additionalItems" without "items"',
    testStrictMode({type: "array", additionalItems: false}, /additionalItems/)
  )

  describe('"if" without "then" and "else"', testStrictMode({if: true}, /if.*then.*else/))

  describe('"then" without "if"', testStrictMode({then: true}, /then.*if/))

  describe('"else" without "if"', testStrictMode({else: true}, /else.*if/))

  describe(
    '"properties" matching "patternProperties"',
    testStrictMode(
      {
        type: "object",
        properties: {foo: false},
        patternProperties: {foo: false},
      },
      /property.*pattern/
    )
  )

  describe('option allowMatchingProperties to allow "properties" matching "patternProperties"', () => {
    it("should NOT throw an error or log a warning", () => {
      const output: any = {}
      const ajv = new _Ajv({
        allowMatchingProperties: true,
        logger: getLogger(output),
      })
      const schema = {
        type: "object",
        properties: {foo: false},
        patternProperties: {foo: false},
      }
      ajv.compile(schema)
      should.not.exist(output.warning)
    })
  })
})

function testStrictMode(schema, logPattern) {
  return () => {
    describe("strict = false", () => {
      it("should NOT throw an error or log a warning", () => {
        const output: any = {}
        const ajv = new _Ajv({
          strict: false,
          logger: getLogger(output),
        })
        ajv.compile(schema)
        should.not.exist(output.warning)
      })
    })

    describe("strict = true or undefined", () => {
      it("should throw an error", () => {
        test(new _Ajv({strict: true}))
        test(new _Ajv())

        function test(ajv) {
          should.throw(() => {
            ajv.compile(schema)
          }, logPattern)
        }
      })
    })

    describe('strict = "log"', () => {
      it("should log a warning", () => {
        const output: any = {}
        const ajv = new _Ajv({
          strict: "log",
          logger: getLogger(output),
        })
        ajv.compile(schema)
        output.warning.should.match(logPattern)
      })
    })
  }
}

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
