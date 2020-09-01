"use strict"

var Ajv = require("../ajv")
require("../chai").should()

describe("issue #182, NaN validation", () => {
  it("should not pass minimum/maximum validation", () => {
    testNaN({minimum: 1}, false)
    testNaN({maximum: 1}, false)
  })

  it("should pass type: number validation", () => {
    testNaN({type: "number"}, true)
  })

  it("should not pass type: integer validation", () => {
    testNaN({type: "integer"}, false)
  })

  function testNaN(schema, NaNisValid) {
    var ajv = new Ajv()
    var validate = ajv.compile(schema)
    validate(NaN).should.equal(NaNisValid)
  }
})
