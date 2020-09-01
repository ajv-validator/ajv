"use strict"

var Ajv = require("../ajv")
var should = require("../chai").should()

describe("nullable option", () => {
  var ajv

  describe("= true", () => {
    beforeEach(() => {
      ajv = new Ajv({
        nullable: true,
      })
    })

    it('should add keyword "nullable"', () => {
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

    it('should respect "nullable" == false with opts.nullable == true', () => {
      testNotNullable({
        type: "number",
        nullable: false,
      })

      testNotNullable({
        type: ["number"],
        nullable: false,
      })
    })
  })

  describe('without option "nullable"', () => {
    it("should ignore keyword nullable", () => {
      ajv = new Ajv()

      testNotNullable({
        type: "number",
        nullable: true,
      })

      testNotNullable({
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

      should.not.throw(() => {
        ajv.compile({nullable: false})
      })
    })
  })

  function testNullable(schema) {
    var validate = ajv.compile(schema)
    validate(1).should.equal(true)
    validate(null).should.equal(true)
    validate("1").should.equal(false)
  }

  function testNotNullable(schema) {
    var validate = ajv.compile(schema)
    validate(1).should.equal(true)
    validate(null).should.equal(false)
    validate("1").should.equal(false)
  }
})
