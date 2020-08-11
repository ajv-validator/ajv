"use strict"

var Ajv = require("../ajv")
require("../chai").should()

describe('issue #521, incorrect warning with "id" property', () => {
  it("should not log warning", () => {
    var ajv = new Ajv()
    var consoleWarn = console.warn
    console.warn = () => {
      throw new Error("should not log warning")
    }

    try {
      ajv.compile({
        $id: "http://example.com/schema.json",
        type: "object",
        properties: {
          id: {type: "string"},
        },
        required: ["id"],
      })
    } finally {
      console.warn = consoleWarn
    }
  })
})
