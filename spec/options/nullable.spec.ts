import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("nullable keyword", () => {
  let ajv

  beforeEach(() => {
    ajv = new _Ajv()
  })

  it('should support keyword "nullable"', () => {
    testNullable({
      type: "number",
      nullable: true,
    })

    testNullable({
      type: ["number"],
      nullable: true,
    })

    testNullable({
      type: ["number", "null"],
    })

    testNullable({
      type: ["number", "null"],
      nullable: true,
    })

    testNotNullable({type: "number"})

    testNotNullable({type: ["number"]})
  })

  it('should respect "nullable" == false', () => {
    testNotNullable({
      type: "number",
      nullable: false,
    })

    testNotNullable({
      type: ["number"],
      nullable: false,
    })
  })

  it("should throw if type includes null with nullable: false", () => {
    should.throw(() => {
      ajv.compile({
        type: ["number", "null"],
        nullable: false,
      })
    }, "type: null contradicts nullable: false")
  })

  it("should throw if nullable is used without type", () => {
    should.throw(() => {
      ajv.compile({
        nullable: true,
      })
    }, '"nullable" cannot be used without "type"')
  })

  function testNullable(schema) {
    const validate = ajv.compile(schema)
    validate(1).should.equal(true)
    validate(null).should.equal(true)
    validate("1").should.equal(false)
  }

  function testNotNullable(schema) {
    const validate = ajv.compile(schema)
    validate(1).should.equal(true)
    validate(null).should.equal(false)
    validate("1").should.equal(false)
  }
})
