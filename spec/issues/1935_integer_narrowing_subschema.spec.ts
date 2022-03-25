import _Ajv from "../ajv"
import Ajv from "ajv"

describe("issue 1935: integer valid type in number sub-schema", () => {
  let ajv: Ajv
  before(() => {
    ajv = new _Ajv({strict: true})
  })

  it("should allow integer in `if`", () => {
    ajv.compile({
      type: "number",
      if: {
        type: "integer",
        maximum: 5,
      },
      else: {
        minimum: 10,
      },
    })
  })

  it("should allow integer in `then`", () => {
    ajv.compile({
      type: "number",
      if: {
        multipleOf: 2,
      },
      then: {
        type: "integer",
        minimum: 10,
      },
    })
  })

  it("should allow integer in `else`", () => {
    ajv.compile({
      type: "number",
      if: {
        maximum: 5,
      },
      else: {
        type: "integer",
        minimum: 10,
      },
    })
  })

  it("should allow integer in `allOf`", () => {
    ajv.compile({
      type: "number",
      allOf: [
        {
          type: "integer",
          minimum: 10,
        },
        {
          multipleOf: 2,
        },
      ],
    })
  })

  it("should allow integer in `oneOf`", () => {
    ajv.compile({
      type: "number",
      oneOf: [
        {
          type: "integer",
          minimum: 10,
        },
        {
          multipleOf: 2,
        },
      ],
    })
  })

  it("should allow integer in `anyOf`", () => {
    ajv.compile({
      type: "number",
      oneOf: [
        {
          type: "integer",
          minimum: 10,
        },
        {
          multipleOf: 2,
        },
      ],
    })
  })

  it("should allow integer in `not`", () => {
    ajv.compile({
      type: "number",
      not: {
        type: "integer",
        minimum: 10,
      },
    })
  })
})
