import _Ajv from "../ajv"
import Ajv from "ajv"
import * as assert from "assert"

describe("integer valid type in number sub-schema (issue #1935)", () => {
  let ajv: Ajv
  before(() => {
    ajv = new _Ajv({strict: true})
  })

  it("should allow integer in `if`", () =>
    assert.doesNotThrow(() =>
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
    ))

  it("should allow integer in `then`", () =>
    assert.doesNotThrow(() =>
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
    ))

  it("should allow integer in `else`", () =>
    assert.doesNotThrow(() =>
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
    ))

  it("should allow integer in `allOf`", () =>
    assert.doesNotThrow(() =>
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
    ))

  it("should allow integer in `oneOf`", () =>
    assert.doesNotThrow(() =>
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
    ))

  it("should allow integer in `anyOf`", () =>
    assert.doesNotThrow(() =>
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
    ))

  it("should allow integer in `not`", () =>
    assert.doesNotThrow(() =>
      ajv.compile({
        type: "number",
        not: {
          type: "integer",
          minimum: 10,
        },
      })
    ))
})
