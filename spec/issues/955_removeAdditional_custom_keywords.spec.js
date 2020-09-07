"use strict"

const Ajv = require("../ajv")
require("../chai").should()

describe("issue #955: option removeAdditional breaks user-defined keywords", () => {
  it("should support user-defined keywords with option removeAdditional", () => {
    const ajv = new Ajv({removeAdditional: "all"})

    ajv.addKeyword({
      keyword: "minTrimmedLength",
      type: "string",
      compile: function (schema) {
        return function (str) {
          return str.trim().length >= schema
        }
      },
      metaSchema: {type: "integer"},
    })

    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "string",
          minTrimmedLength: 3,
        },
      },
      required: ["foo"],
    }

    const validate = ajv.compile(schema)

    let data = {
      foo: "   bar   ",
      baz: "",
    }
    validate(data).should.equal(true)
    data.should.not.have.property("baz")

    data = {
      foo: "   ba   ",
      baz: "",
    }
    validate(data).should.equal(false)
    data.should.not.have.property("baz")
  })
})
