import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("issue #743, property __proto__ should be removed with removeAdditional option", () => {
  it("should remove additional properties", () => {
    const ajv = new _Ajv({removeAdditional: true})

    const schema = {
      type: "object",
      properties: {
        obj: {
          type: "object",
          additionalProperties: false,
          properties: {
            a: {type: "string"},
            b: {type: "string"},
            c: {type: "string"},
            d: {type: "string"},
            e: {type: "string"},
            f: {type: "string"},
            g: {type: "string"},
            h: {type: "string"},
            i: {type: "string"},
          },
        },
      },
    }

    const obj = Object.create(null)
    obj.__proto__ = null // should be removed
    obj.additional = "will be removed"
    obj.a = "valid"
    obj.b = "valid"

    const data = {obj: obj}

    ajv.validate(schema, data).should.equal(true)
    Object.keys(data.obj).should.eql(["a", "b"])
  })
})
