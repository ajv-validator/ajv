import type {ValidateFunction} from "../.."
import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("issue #815, id and $id fields should reset base", () => {
  let validate: ValidateFunction

  const schema = {
    type: "object",
    properties: {
      newRoot: {
        $id: "http://example.com/newRoot",
        type: "object",
        properties: {
          recurse: {
            $ref: "#",
          },
          name: {
            type: "string",
          },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
    required: ["newRoot"],
    additionalProperties: false,
  }

  before(() => {
    validate = new _Ajv().compile(schema)
  })

  it("should set # to reference the closest ancestor with $id", () => {
    validate({
      newRoot: {
        name: "test",
      },
    }).should.equal(true)

    validate({
      newRoot: {
        name: "test",
        recurse: {
          name: "test2",
        },
      },
    }).should.equal(true)
  })

  it("should NOT set # to reference the absolute document root", () => {
    validate({
      newRoot: {
        name: "test",
        recurse: {
          newRoot: {
            name: "test2",
          },
        },
      },
    }).should.equal(false)
  })
})
