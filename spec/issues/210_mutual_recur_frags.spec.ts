import type AjvCore from "../../dist/core"
import type AjvPack from "../../dist/standalone/instance"
import {getStandalone} from "../ajv_standalone"
import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("issue #210, mutual recursive $refs that are schema fragments", () => {
  describe("one ref is fragment", () => {
    it("should compile and validate schema", spec(new _Ajv()))
    it("should compile and validate schema: standalone", spec(getStandalone(_Ajv)))

    function spec(ajv: AjvCore | AjvPack): () => void {
      return () => {
        ajv.addSchema({
          $id: "foo",
          definitions: {
            bar: {
              type: "object",
              properties: {
                baz: {
                  anyOf: [{enum: [42]}, {$ref: "boo"}],
                },
              },
            },
          },
        })

        ajv.addSchema({
          $id: "boo",
          type: "object",
          required: ["quux"],
          properties: {
            quux: {$ref: "foo#/definitions/bar"},
          },
        })

        const validate = ajv.compile({$ref: "foo#/definitions/bar"})
        validate({baz: {quux: {baz: 42}}}).should.equal(true)
        validate({baz: {quux: {baz: "foo"}}}).should.equal(false)
      }
    }
  })

  describe("both refs are fragments", () => {
    it("should compile and validate schema", spec(new _Ajv()))
    it("should compile and validate schema: standalone", spec(getStandalone(_Ajv)))

    function spec(ajv: AjvCore | AjvPack): () => void {
      return () => {
        ajv.addSchema({
          $id: "foo",
          definitions: {
            bar: {
              type: "object",
              properties: {
                baz: {
                  anyOf: [{enum: [42]}, {$ref: "boo#/definitions/buu"}],
                },
              },
            },
          },
        })

        ajv.addSchema({
          $id: "boo",
          definitions: {
            buu: {
              type: "object",
              required: ["quux"],
              properties: {
                quux: {$ref: "foo#/definitions/bar"},
              },
            },
          },
        })

        const validate = ajv.compile({$ref: "foo#/definitions/bar"})

        validate({baz: {quux: {baz: 42}}}).should.equal(true)
        validate({baz: {quux: {baz: "foo"}}}).should.equal(false)
      }
    }
  })
})
