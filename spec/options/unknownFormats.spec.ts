import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

const DATE_FORMAT = /^\d\d\d\d-[0-1]\d-[0-3]\d$/

describe("specifying allowed unknown formats with `formats` option", () => {
  describe("= true (default)", () => {
    it("should fail schema compilation if unknown format is used", () => {
      test(new _Ajv())

      function test(ajv) {
        should.throw(() => {
          ajv.compile({type: "string", format: "unknown"})
        }, /unknown format/)
      }
    })

    it("should fail validation if unknown format is used via $data", () => {
      test(new _Ajv({$data: true, strictTypes: false}))

      function test(ajv) {
        ajv.addFormat("date", DATE_FORMAT)
        const validate = ajv.compile({
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
      test(new _Ajv({strict: false, logger: false}))

      function test(ajv) {
        const validate = ajv.compile({format: "unknown"})
        validate("anything").should.equal(true)
      }
    })

    it("should be valid if unknown format is used via $data", () => {
      test(new _Ajv({$data: true, strict: false}))

      function test(ajv) {
        ajv.addFormat("date", DATE_FORMAT)
        const validate = ajv.compile({
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
      test(new _Ajv({formats: {allowed: true}}))

      function test(ajv) {
        const validate = ajv.compile({type: "string", format: "allowed"})
        validate("anything").should.equal(true)

        should.throw(() => {
          ajv.compile({type: "string", format: "unknown"})
        }, /unknown format/)
      }
    })

    it("should be valid if allowed unknown format is used via $data", () => {
      test(new _Ajv({$data: true, formats: {allowed: true}, allowUnionTypes: true}))

      function test(ajv) {
        ajv.addFormat("date", DATE_FORMAT)
        const validate = ajv.compile({
          type: "object",
          properties: {
            foo: {type: ["string", "number"], format: {$data: "1/bar"}},
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
