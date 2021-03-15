import type Ajv from ".."
import type {SchemaObject} from ".."
import _Ajv from "./ajv"
// import _Ajv2019 from "./ajv2019"
// import getAjvInstances from "./ajv_instances"
// import {withStandalone} from "./ajv_standalone"
// import options from "./ajv_options"
import * as assert from "assert"

describe("discriminator keyword", () => {
  let ajvs: Ajv[]

  before(() => {
    ajvs = [new _Ajv({discriminator: true})]
  })

  describe("discriminator without mapping", () => {
    describe("validation", () => {
      const schema = {
        type: "object",
        discriminator: {propertyName: "foo"},
        oneOf: [
          {
            properties: {
              foo: {const: "x"},
              a: {type: "string"},
            },
            required: ["foo", "a"],
          },
          {
            properties: {
              foo: {enum: ["y", "z"]},
              b: {type: "string"},
            },
            required: ["foo", "b"],
          },
        ],
      }

      it("should validate data", () => {
        assertValid(schema, {foo: "x", a: "a"})
        assertValid(schema, {foo: "y", b: "b"})
        assertValid(schema, {foo: "z", b: "b"})
        assertInvalid(schema, {})
        assertInvalid(schema, {foo: "bar"})
        assertInvalid(schema, {foo: "x", b: "b"})
        assertInvalid(schema, {foo: "y", a: "a"})
        assertInvalid(schema, {foo: "z", a: "a"})
      })
    })

    describe("invalid schemas", () => {})
  })

  describe("discriminator with mapping", () => {
    describe("validation", () => {})

    describe("invalid schemas", () => {})
  })

  function assertValid(schema: SchemaObject, data: unknown): void {
    ajvs.forEach((ajv) => {
      assert.strictEqual(ajv.validate(schema, data), true)
    })
  }

  function assertInvalid(schema: SchemaObject, data: unknown): void {
    ajvs.forEach((ajv) => {
      assert.strictEqual(ajv.validate(schema, data), false)
    })
  }
})
