"use strict"

var Ajv = require("../ajv")
require("../chai").should()
var DATE_FORMAT = /^\d\d\d\d-[0-1]\d-[0-3]\d$/

describe("validation options", () => {
  describe("format", () => {
    it("should not validate formats if option format == false", () => {
      var ajv = new Ajv({formats: {date: DATE_FORMAT}}),
        ajvFF = new Ajv({formats: {date: DATE_FORMAT}, format: false})

      var schema = {format: "date"}
      var invalideDateTime = "06/19/1963" // expects hyphens

      ajv.validate(schema, invalideDateTime).should.equal(false)
      ajvFF.validate(schema, invalideDateTime).should.equal(true)
    })
  })

  describe("formats", () => {
    it("should add formats from options", () => {
      var ajv = new Ajv({
        formats: {
          identifier: /^[a-z_$][a-z0-9_$]*$/i,
        },
      })

      var validate = ajv.compile({format: "identifier"})

      validate("Abc1").should.equal(true)
      validate("foo bar").should.equal(false)
      validate("123").should.equal(false)
      validate(123).should.equal(true)
    })
  })

  describe("keywords", () => {
    it("should add keywords from options", () => {
      var ajv = new Ajv({
        keywords: {
          identifier: {
            type: "string",
            validate: function (schema, data) {
              return /^[a-z_$][a-z0-9_$]*$/i.test(data)
            },
          },
        },
      })

      var validate = ajv.compile({identifier: true})

      validate("Abc1").should.equal(true)
      validate("foo bar").should.equal(false)
      validate("123").should.equal(false)
      validate(123).should.equal(true)
    })
  })

  describe("uniqueItems", () => {
    it("should not validate uniqueItems with uniqueItems option == false", () => {
      testUniqueItems(new Ajv({uniqueItems: false}))
      testUniqueItems(new Ajv({uniqueItems: false, allErrors: true}))

      function testUniqueItems(ajv) {
        var validate = ajv.compile({uniqueItems: true})
        validate([1, 2, 3]).should.equal(true)
        validate([1, 1, 1]).should.equal(true)
      }
    })
  })

  describe("unicode", () => {
    it("should use String.prototype.length with unicode option == false", () => {
      var ajvUnicode = new Ajv()
      testUnicode(new Ajv({unicode: false}))
      testUnicode(new Ajv({unicode: false, allErrors: true}))

      function testUnicode(ajv) {
        var validateWithUnicode = ajvUnicode.compile({minLength: 2})
        var validate = ajv.compile({minLength: 2})

        validateWithUnicode("😀").should.equal(false)
        validate("😀").should.equal(true)

        validateWithUnicode = ajvUnicode.compile({maxLength: 1})
        validate = ajv.compile({maxLength: 1})

        validateWithUnicode("😀").should.equal(true)
        validate("😀").should.equal(false)
      }
    })
  })

  describe("multipleOfPrecision", () => {
    it("should allow for some deviation from 0 when validating multipleOf with value < 1", () => {
      test(new Ajv({multipleOfPrecision: 7}))
      test(new Ajv({multipleOfPrecision: 7, allErrors: true}))

      function test(ajv) {
        var schema = {multipleOf: 0.01}
        var validate = ajv.compile(schema)

        validate(4.18).should.equal(true)
        validate(4.181).should.equal(false)

        schema = {multipleOf: 0.0000001}
        validate = ajv.compile(schema)

        validate(53.198098).should.equal(true)
        validate(53.1980981).should.equal(true)
        validate(53.19809811).should.equal(false)
      }
    })
  })
})
