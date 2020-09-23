import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("reporting options", () => {
  describe("verbose", () => {
    it("should add schema, parentSchema and data to errors with verbose option == true", () => {
      testVerbose(new _Ajv({verbose: true}))
      testVerbose(new _Ajv({verbose: true, allErrors: true}))

      function testVerbose(ajv) {
        const schema = {
          type: "object",
          properties: {
            foo: {type: "number", minimum: 5},
          },
        }
        const validate = ajv.compile(schema)

        const data = {foo: 3}
        validate(data).should.equal(false)
        validate.errors.should.have.length(1)
        const err = validate.errors[0]

        should.equal(err.schema, 5)
        err.parentSchema.should.eql({type: "number", minimum: 5})
        err.parentSchema.should.equal(schema.properties.foo) // by reference
        should.equal(err.data, 3)
      }
    })
  })

  describe("allErrors", () => {
    it('should be disabled inside "not" keyword', () => {
      test(new _Ajv(), false)
      test(new _Ajv({allErrors: true}), true)

      function test(ajv, allErrors) {
        let format1called = false,
          format2called = false

        ajv.addFormat("format1", () => {
          format1called = true
          return false
        })

        ajv.addFormat("format2", () => {
          format2called = true
          return false
        })

        const schema1 = {
          type: "string",
          allOf: [{format: "format1"}, {format: "format2"}],
        }

        ajv.validate(schema1, "abc").should.equal(false)
        ajv.errors.should.have.length(allErrors ? 2 : 1)
        format1called.should.equal(true)
        format2called.should.equal(allErrors)

        const schema2 = {
          not: schema1,
        }

        format1called = format2called = false
        ajv.validate(schema2, "abc").should.equal(true)
        should.equal(ajv.errors, null)
        format1called.should.equal(true)
        format2called.should.equal(false)
      }
    })
  })

  describe("logger", () => {
    /**
     * The logger option tests are based on the meta scenario which writes into the logger.warn
     */

    const origConsoleWarn = console.warn
    let consoleCalled

    beforeEach(() => {
      consoleCalled = false
      console.warn = () => (consoleCalled = true)
    })

    afterEach(() => {
      console.warn = origConsoleWarn
    })

    it("no user-defined logger is given - global console should be used", () => {
      const ajv = new _Ajv({meta: false})

      ajv.compile({
        type: "number",
        minimum: 1,
      })

      should.equal(consoleCalled, true)
    })

    it("user-defined logger is an object - logs should only report to it", () => {
      let loggerCalled = false

      const logger = {
        warn: log,
        log: log,
        error: log,
      }

      const ajv = new _Ajv({
        meta: false,
        logger: logger,
      })

      ajv.compile({
        type: "number",
        minimum: 1,
      })

      should.equal(loggerCalled, true)
      should.equal(consoleCalled, false)

      function log() {
        loggerCalled = true
      }
    })

    it("logger option is false - no logs should be reported", () => {
      const ajv = new _Ajv({
        meta: false,
        logger: false,
      })

      ajv.compile({
        type: "number",
        minimum: 1,
      })

      should.equal(consoleCalled, false)
    })

    it("logger option is an object without required methods - an error should be thrown", () => {
      const opts: any = {
        meta: false,
        logger: {},
      }
      ;(() => new _Ajv(opts)).should.throw(
        Error,
        /logger must implement log, warn and error methods/
      )
    })
  })
})
