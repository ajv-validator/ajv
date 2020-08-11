"use strict"

var Ajv = require("../ajv")
var should = require("../chai").should()
var DATE_FORMAT = /^\d\d\d\d-[0-1]\d-[0-3]\d$/

describe("unknownFormats option", () => {
  describe("= true (default)", () => {
    it("should fail schema compilation if unknown format is used", () => {
      test(new Ajv())
      test(new Ajv({unknownFormats: true}))

      function test(ajv) {
        should.throw(() => {
          ajv.compile({format: "unknown"})
        })
      }
    })

    it("should fail validation if unknown format is used via $data", () => {
      test(new Ajv({$data: true}))
      test(new Ajv({$data: true, unknownFormats: true}))

      function test(ajv) {
        ajv.addFormat("date", DATE_FORMAT)
        var validate = ajv.compile({
          properties: {
            foo: {format: {$data: "1/bar"}},
            bar: {type: "string"},
          },
        })

        validate({foo: 1, bar: "unknown"}).should.equal(false)
        validate({foo: "2016-10-16", bar: "date"}).should.equal(true)
        validate({foo: "20161016", bar: "date"}).should.equal(false)
        validate({foo: "20161016"}).should.equal(true)

        validate({foo: "2016-10-16", bar: "unknown"}).should.equal(false)
      }
    })
  })

  describe('= "ignore (default before 5.0.0)"', () => {
    it("should pass schema compilation and be valid if unknown format is used", () => {
      test(new Ajv({unknownFormats: "ignore"}))

      function test(ajv) {
        var validate = ajv.compile({format: "unknown"})
        validate("anything").should.equal(true)
      }
    })

    it("should be valid if unknown format is used via $data", () => {
      test(new Ajv({$data: true, unknownFormats: "ignore"}))

      function test(ajv) {
        ajv.addFormat("date", DATE_FORMAT)
        var validate = ajv.compile({
          properties: {
            foo: {format: {$data: "1/bar"}},
            bar: {type: "string"},
          },
        })

        validate({foo: 1, bar: "unknown"}).should.equal(true)
        validate({foo: "2016-10-16", bar: "date"}).should.equal(true)
        validate({foo: "20161016", bar: "date"}).should.equal(false)
        validate({foo: "20161016"}).should.equal(true)
        validate({foo: "2016-10-16", bar: "unknown"}).should.equal(true)
      }
    })
  })

  describe("= [String]", () => {
    it("should pass schema compilation and be valid if allowed unknown format is used", () => {
      test(new Ajv({unknownFormats: ["allowed"]}))

      function test(ajv) {
        var validate = ajv.compile({format: "allowed"})
        validate("anything").should.equal(true)

        should.throw(() => {
          ajv.compile({format: "unknown"})
        })
      }
    })

    it("should be valid if allowed unknown format is used via $data", () => {
      test(new Ajv({$data: true, unknownFormats: ["allowed"]}))

      function test(ajv) {
        ajv.addFormat("date", DATE_FORMAT)
        var validate = ajv.compile({
          properties: {
            foo: {format: {$data: "1/bar"}},
            bar: {type: "string"},
          },
        })

        validate({foo: 1, bar: "allowed"}).should.equal(true)
        validate({foo: 1, bar: "unknown"}).should.equal(false)
        validate({foo: "2016-10-16", bar: "date"}).should.equal(true)
        validate({foo: "20161016", bar: "date"}).should.equal(false)
        validate({foo: "20161016"}).should.equal(true)

        validate({foo: "2016-10-16", bar: "allowed"}).should.equal(true)
        validate({foo: "2016-10-16", bar: "unknown"}).should.equal(false)
      }
    })
  })
})
