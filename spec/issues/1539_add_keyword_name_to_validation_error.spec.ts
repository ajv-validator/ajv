import _Ajv from "../ajv2019"
import chai from "../chai"
const should = chai.should()

describe("keyword usage validation error", () => {
  it("should include the keyword name and schema path in the message", () => {
    const ajv = new _Ajv({
      keywords: [
        {
          keyword: "customKeyword",
          metaSchema: {
            type: "string",
          },
          macro() {
            return {}
          },
        },
      ],
    })

    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "object",
          customKeyword: {
            bar: true,
          },
        },
      },
    }

    should.throw(
      () => ajv.compile(schema),
      'keyword "customKeyword" value is invalid at path "#/properties/foo": data must be string'
    )
  })
})
