import _Ajv from "../ajv2020"
import Ajv from "ajv"

describe("issue #1950, strictRequired should allow properties from parent schemas", () => {
  let ajv: Ajv
  before(() => {
    ajv = new _Ajv({strictRequired: true})
  })

  it("should allow defined property in `if`", () => {
    ajv.compile({
      type: "object",
      properties: {
        a: {type: "number"},
        b: {type: "number"},
        c: {type: "number"},
        d: {type: "number"},
      },
      if: {
        required: ["a"],
      },
      then: {
        required: ["b", "c"],
      },
      required: ["d"],
    })
  })

  it("should allow defined property in `anyOf`", () => {
    ajv.compile({
      type: "object",
      properties: {
        a: {type: "number"},
        b: {type: "number"},
        c: {type: "number"},
        d: {type: "number"},
      },
      anyOf: [
        {
          not: {required: ["a"]},
        },
        {required: ["b", "c"]},
      ],
    })
  })

  it("should allow defined property in `allOf`", () => {
    ajv.compile({
      type: "object",
      properties: {
        a: {type: "number"},
        b: {type: "number"},
        c: {type: "number"},
        d: {type: "number"},
      },
      allOf: [
        {
          allOf: [
            {
              required: ["d"],
            },
          ],
          dependentRequired: {
            a: ["b", "c", "e"],
          },
        },
      ],
    })
  })

  it("should not recognize properties defined in subschema", () => {
    ;(() =>
      ajv.compile({
        type: "object",
        properties: {
          a: {type: "number"},
          b: {type: "number"},
        },
        allOf: [
          {
            properties: {
              c: {type: "number"},
              d: {type: "number"},
            },
          },
        ],
        required: ["c"],
      })).should.throw('strict mode: required property "c" is not defined at "#" (strictRequired)')
  })

  it("should not recognize properties defined in sibling schema", () => {
    global._CAN_LOG = true
    ;(() =>
      ajv.compile({
        type: "object",
        properties: {
          a: {type: "number"},
          b: {type: "number"},
        },
        allOf: [
          {
            properties: {
              c: {type: "number"},
              d: {type: "number"},
            },
            required: ["b", "d"],
          },
          {
            required: ["a", "c"],
          },
        ],
      })).should.throw(
      'strict mode: required property "c" is not defined at "#/allOf/1" (strictRequired)'
    )
  })

  it("should not recognize properties defined in child schema", () => {
    global._CAN_LOG = false
    ;(() =>
      ajv.compile({
        type: "object",
        properties: {
          a: {type: "number"},
          b: {
            type: "object",
            properties: {
              c: {type: "number"},
            },
          },
        },
        required: ["b", "c"],
      })).should.throw('strict mode: required property "c" is not defined at "#" (strictRequired)')
  })
})
