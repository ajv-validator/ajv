"use strict"

var Ajv = require("../ajv")
require("../chai").should()

describe("issue #1001: addKeyword breaks schema without ID", () => {
  it("should allow using schemas without ID with addKeyword", () => {
    var schema = {
      definitions: {
        foo: {},
      },
    }

    var ajv = new Ajv()
    ajv.addSchema(schema)
    ajv.addKeyword("myKeyword", {})
    ajv.getSchema("#/definitions/foo").should.be.a("function")
  })
})
