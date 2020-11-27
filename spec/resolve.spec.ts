import type AjvCore from "../dist/core"
import getAjvInstances from "./ajv_instances"
import _Ajv from "./ajv"
import {AnyValidateFunction} from "../dist/types"
import chai from "./chai"
const should = chai.should()

describe("resolve", () => {
  let instances: AjvCore[]

  beforeEach(() => {
    instances = getAjvInstances(_Ajv, {
      allErrors: true,
      verbose: true,
      inlineRefs: false,
      allowUnionTypes: true,
    })
  })

  describe("resolve.ids method", () => {
    it("should resolve ids in schema", () => {
      // Example from http://json-schema.org/latest/json-schema-core.html#anchor29
      const schema = {
        $id: "http://x.y.z/rootschema.json#",
        $defs: {
          schema1: {
            $id: "#foo",
            description: "schema1",
            type: "integer",
          },
          schema2: {
            $id: "otherschema.json",
            description: "schema2",
            $defs: {
              nested: {
                $id: "#bar",
                description: "nested",
                type: "string",
              },
              alsonested: {
                $id: "t/inner.json#a",
                description: "alsonested",
                type: "boolean",
              },
            },
          },
          schema3: {
            $id: "some://where.else/completely#",
            description: "schema3",
            type: "null",
          },
        },
        type: "object",
        properties: {
          foo: {$ref: "#foo"},
          bar: {$ref: "otherschema.json#bar"},
          baz: {$ref: "t/inner.json#a"},
          bax: {$ref: "some://where.else/completely#"},
        },
        required: ["foo", "bar", "baz", "bax"],
      }

      instances.forEach((ajv) => {
        const validate = ajv.compile(schema)
        const data = {foo: 1, bar: "abc", baz: true, bax: null}
        validate(data).should.equal(true)
      })
    })

    it("should throw if the same id resolves to two different schemas", () => {
      instances.forEach((ajv) => {
        ajv.compile({
          $id: "http://example.com/1.json",
          type: "integer",
        })
        should.throw(() => {
          ajv.compile({
            type: "object",
            additionalProperties: {
              $id: "http://example.com/1.json",
              type: "string",
            },
          })
        }, /resolves to more than one schema/)

        should.throw(() => {
          ajv.compile({
            type: ["object", "array"],
            items: {
              $id: "#int",
              type: "integer",
            },
            additionalProperties: {
              $id: "#int",
              type: "string",
            },
          })
        }, /resolves to more than one schema/)
      })
    })

    it("should resolve ids defined as urn's (issue #423)", () => {
      const schema = {
        type: "object",
        properties: {
          ip1: {
            $id: "urn:some:ip:prop",
            type: "string",
            pattern: "^(\\d+\\.){3}\\d+$",
          },
          ip2: {
            $ref: "urn:some:ip:prop",
          },
        },
        required: ["ip1", "ip2"],
      }

      const data = {
        ip1: "0.0.0.0",
        ip2: "0.0.0.0",
      }
      instances.forEach((ajv) => {
        const validate = ajv.compile(schema)
        validate(data).should.equal(true)
      })
    })
  })

  describe("protocol-relative URIs", () => {
    it("should resolve fragment", () => {
      instances.forEach((ajv) => {
        const schema = {
          $id: "//e.com/types",
          definitions: {
            int: {type: "integer"},
          },
        }

        ajv.addSchema(schema)
        const validate = ajv.compile({$ref: "//e.com/types#/definitions/int"})
        validate(1).should.equal(true)
        validate("foo").should.equal(false)
      })
    })
  })

  describe("missing schema error", function () {
    this.timeout(4000)

    it("should contain missingRef and missingSchema", () => {
      testMissingSchemaError({
        baseId: "http://example.com/1.json",
        ref: "http://another.com/int.json",
        expectedMissingRef: "http://another.com/int.json",
        expectedMissingSchema: "http://another.com/int.json",
      })
    })

    it("should resolve missingRef and missingSchema relative to base id", () => {
      testMissingSchemaError({
        baseId: "http://example.com/folder/1.json",
        ref: "int.json",
        expectedMissingRef: "http://example.com/folder/int.json",
        expectedMissingSchema: "http://example.com/folder/int.json",
      })
    })

    it("should resolve missingRef and missingSchema relative to base id from root", () => {
      testMissingSchemaError({
        baseId: "http://example.com/folder/1.json",
        ref: "/int.json",
        expectedMissingRef: "http://example.com/int.json",
        expectedMissingSchema: "http://example.com/int.json",
      })
    })

    it("missingRef should and missingSchema should NOT include JSON path (hash fragment)", () => {
      testMissingSchemaError({
        baseId: "http://example.com/1.json",
        ref: "int.json#/definitions/positive",
        expectedMissingRef: "http://example.com/int.json#/definitions/positive",
        expectedMissingSchema: "http://example.com/int.json",
      })
    })

    it("should throw missing schema error if same path exist in the current schema but id is different (issue #220)", () => {
      testMissingSchemaError({
        baseId: "http://example.com/parent.json",
        ref: "object.json#/properties/a",
        expectedMissingRef: "http://example.com/object.json#/properties/a",
        expectedMissingSchema: "http://example.com/object.json",
      })
    })

    function testMissingSchemaError(opts) {
      instances.forEach((ajv) => {
        try {
          ajv.compile({
            $id: opts.baseId,
            type: "object",
            properties: {a: {$ref: opts.ref}},
          })
        } catch (e) {
          e.missingRef.should.equal(opts.expectedMissingRef)
          e.missingSchema.should.equal(opts.expectedMissingSchema)
        }
      })
    }
  })

  describe("inline referenced schemas without refs in them", () => {
    const schemas = [
      {$id: "http://e.com/obj.json#", type: "object", properties: {a: {$ref: "int.json#"}}},
      {$id: "http://e.com/int.json#", type: "integer", minimum: 2, maximum: 4},
      {
        $id: "http://e.com/obj1.json#",
        type: "object",
        definitions: {int: {type: "integer", minimum: 2, maximum: 4}},
        properties: {a: {$ref: "#/definitions/int"}},
      },
      {$id: "http://e.com/list.json#", type: "array", items: {$ref: "obj.json#"}},
    ]

    it("by default should inline schema if it doesn't contain refs", () => {
      const ajv = new _Ajv({schemas, code: {source: true}})
      testSchemas(ajv, true)
    })

    it("should NOT inline schema if option inlineRefs == false", () => {
      const ajv = new _Ajv({schemas, inlineRefs: false, code: {source: true}})
      testSchemas(ajv, false)
    })

    it("should inline schema if option inlineRefs is bigger than number of keys in referenced schema", () => {
      const ajv = new _Ajv({schemas, inlineRefs: 4, code: {source: true}})
      testSchemas(ajv, true)
    })

    it("should NOT inline schema if option inlineRefs is less than number of keys in referenced schema", () => {
      const ajv = new _Ajv({schemas, inlineRefs: 2, code: {source: true}})
      testSchemas(ajv, false)
    })

    it("should avoid schema substitution when refs are inlined (issue #77)", () => {
      const ajv = new _Ajv({verbose: true})

      const schemaMessage = {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: "http://e.com/message.json#",
        type: "object",
        required: ["header"],
        properties: {
          header: {
            type: "object",
            allOf: [{$ref: "header.json"}, {properties: {msgType: {enum: [0]}}}],
          },
        },
      }

      // header schema
      const schemaHeader = {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: "http://e.com/header.json#",
        type: "object",
        properties: {
          version: {
            type: "integer",
            maximum: 5,
          },
          msgType: {type: "integer"},
        },
        required: ["version", "msgType"],
      }

      // a good message
      const validMessage = {
        header: {
          version: 4,
          msgType: 0,
        },
      }

      // a bad message
      const invalidMessage = {
        header: {
          version: 6,
          msgType: 0,
        },
      }

      // add schemas and get validator function
      ajv.addSchema(schemaHeader)
      ajv.addSchema(schemaMessage)
      const v: any = ajv.getSchema("http://e.com/message.json#")

      v(validMessage).should.equal(true)
      v.schema.$id.should.equal("http://e.com/message.json#")

      v(invalidMessage).should.equal(false)
      v.errors.should.have.length(1)
      v.schema.$id.should.equal("http://e.com/message.json#")

      v(validMessage).should.equal(true)
      v.schema.$id.should.equal("http://e.com/message.json#")
    })

    function testSchemas(ajv, expectedInlined) {
      const v1 = ajv.getSchema("http://e.com/obj.json"),
        v2 = ajv.getSchema("http://e.com/obj1.json"),
        v3 = ajv.getSchema("http://e.com/list.json")
      testObjSchema(v1)
      testObjSchema(v2)
      testListSchema(v3)
      testInlined(v1, expectedInlined)
      testInlined(v2, expectedInlined)
      testInlined(v3, false)
    }

    function testObjSchema(validate) {
      validate({a: 3}).should.equal(true)
      validate({a: 1}).should.equal(false)
      validate({a: 5}).should.equal(false)
    }

    function testListSchema(validate) {
      validate([{a: 3}]).should.equal(true)
      validate([{a: 1}]).should.equal(false)
      validate([{a: 5}]).should.equal(false)
    }

    function testInlined(validate: AnyValidateFunction, expectedInlined) {
      const inlined: any = !validate.source?.scopeValues.validate
      inlined.should.equal(expectedInlined)
    }
  })

  describe("duplicate internal $id", () => {
    it("should throw error with duplicate IDs in definitions", () => {
      const schema = {
        $id: "http://example.com/example.json",
        $defs: {
          foo: {
            $id: "#nope",
            type: "integer",
          },
          bar: {
            $id: "#nope",
            type: "string",
          },
        },
        type: "object",
        properties: {
          foo: {$ref: "#/$defs/foo"},
          bar: {$ref: "#/$defs/bar"},
        },
      }

      instances.forEach((ajv) =>
        should.throw(() => ajv.compile(schema), /nope.*resolves to more than one schema/)
      )
    })

    it("should throw error with duplicate IDs in properties", () => {
      const schema = {
        $id: "http://example.com/example.json",
        type: "object",
        properties: {
          foo: {
            $id: "#nope",
            type: "integer",
          },
          bar: {
            $id: "#nope",
            type: "string",
          },
        },
      }

      instances.forEach((ajv) =>
        should.throw(() => ajv.compile(schema), /nope.*resolves to more than one schema/)
      )
    })
  })
})
