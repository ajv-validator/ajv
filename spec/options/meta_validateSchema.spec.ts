import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("meta and validateSchema options", () => {
  it("should add draft-7 meta schema by default", () => {
    testOptionMeta(new _Ajv())
    testOptionMeta(new _Ajv({meta: true}))

    function testOptionMeta(ajv) {
      ajv.getSchema("http://json-schema.org/draft-07/schema").should.be.a("function")
      ajv.validateSchema({$id: "ok", type: "integer"}).should.equal(true)
      ajv.validateSchema({$id: "wrong", type: 123}).should.equal(false)
      should.not.throw(() => {
        ajv.addSchema({$id: "ok", type: "integer"})
      })
      should.throw(() => {
        ajv.addSchema({$id: "wrong", type: 123})
      }, /schema is invalid/)
    }
  })

  it("should throw if meta: false and validateSchema: true", () => {
    const ajv = new _Ajv({meta: false, logger: false})
    should.not.exist(ajv.getSchema("http://json-schema.org/draft-07/schema"))
    should.not.throw(() => {
      ajv.addSchema({type: "wrong_type"}, "integer")
    })
  })

  it("should skip schema validation with validateSchema: false", () => {
    let ajv = new _Ajv()
    should.throw(() => {
      ajv.addSchema({type: 123}, "integer")
    }, /schema is invalid/)

    ajv = new _Ajv({validateSchema: false})
    should.not.throw(() => {
      ajv.addSchema({type: 123}, "integer")
    })

    ajv = new _Ajv({validateSchema: false, meta: false})
    should.not.throw(() => {
      ajv.addSchema({type: 123}, "integer")
    })
  })

  describe('validateSchema: "log"', () => {
    let loggedError, loggedWarning
    const logger = {
      log() {},
      warn: () => (loggedWarning = true),
      error: () => (loggedError = true),
    }

    beforeEach(() => {
      loggedError = false
      loggedWarning = false
    })

    it("should not throw on invalid schema", () => {
      const ajv = new _Ajv({validateSchema: "log", logger})
      should.not.throw(() => {
        ajv.addSchema({type: 123}, "integer")
      })
      loggedError.should.equal(true)
      loggedWarning.should.equal(false)
    })

    it("should not throw on invalid schema with meta: false", () => {
      const ajv = new _Ajv({validateSchema: "log", meta: false, logger})
      should.not.throw(() => {
        ajv.addSchema({type: 123}, "integer")
      })
      loggedError.should.equal(false)
      loggedWarning.should.equal(true)
    })
  })

  it("should validate v6 schema", () => {
    const ajv = new _Ajv()
    ajv.validateSchema({contains: {minimum: 2}}).should.equal(true)
    ajv.validateSchema({contains: 2}).should.equal(false)
  })

  it("should use option meta as default meta schema", () => {
    const meta = {
      $schema: "http://json-schema.org/draft-07/schema",
      properties: {
        myKeyword: {type: "boolean"},
      },
    }
    let ajv = new _Ajv({meta: meta})
    ajv.validateSchema({myKeyword: true}).should.equal(true)
    ajv.validateSchema({myKeyword: 2}).should.equal(false)
    ajv
      .validateSchema({
        $schema: "http://json-schema.org/draft-07/schema",
        myKeyword: 2,
      })
      .should.equal(true)

    ajv = new _Ajv()
    ajv.validateSchema({myKeyword: true}).should.equal(true)
    ajv.validateSchema({myKeyword: 2}).should.equal(true)
  })
})
