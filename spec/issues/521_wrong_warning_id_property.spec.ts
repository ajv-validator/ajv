import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe('issue #521, incorrect warning with "id" property', () => {
  it("should not log warning", () => {
    const ajv = new _Ajv()
    const consoleWarn = console.warn
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
