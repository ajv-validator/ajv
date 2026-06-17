import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

// https://github.com/ajv-validator/ajv/issues/2538
describe("strictSchema with unknown format (issue #2538)", () => {
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

  describe('strictSchema = "log"', () => {
    it("should log a warning for an unknown format, not throw", () => {
      const output: any = {}
      const ajv = new _Ajv({strictSchema: "log", logger: getLogger(output)})
      should.not.throw(() => ajv.compile({type: "string", format: "unknown"}))
      output.warning.should.match(/unknown format "unknown"/)
    })
  })

  describe("strictSchema = false", () => {
    it("should neither throw nor log a warning for an unknown format", () => {
      const output: any = {}
      const ajv = new _Ajv({strictSchema: false, logger: getLogger(output)})
      should.not.throw(() => ajv.compile({type: "string", format: "unknown"}))
      should.not.exist(output.warning)
    })
  })

  describe("strictSchema = true (default)", () => {
    it("should throw for an unknown format", () => {
      const ajv = new _Ajv({strictSchema: true})
      should.throw(
        () => ajv.compile({type: "string", format: "unknown"}),
        /unknown format "unknown"/
      )
    })
  })
})
