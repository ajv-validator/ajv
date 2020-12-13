import type Ajv from ".."
import type {KeywordCxt, SchemaObject} from ".."
import _Ajv from "./ajv"
import {_} from "../dist/compile/codegen/code"
import assert = require("assert")
import chai from "./chai"
const should = chai.should()

describe("Ajv", () => {
  let ajv: Ajv

  beforeEach(() => {
    ajv = new _Ajv({keywords: ["foo"], allowUnionTypes: true})
  })

  it("should create instance", () => {
    ajv.should.be.instanceof(_Ajv)
  })

  describe("compile method", () => {
    it("should compile schema and return validating function", () => {
      const validate = ajv.compile({type: "integer"})
      validate.should.be.a("function")
      validate(1).should.equal(true)
      validate(1.1).should.equal(false)
      validate("1").should.equal(false)
    })

    it("should cache compiled functions for the same schema", () => {
      const schema = {
        $id: "//e.com/int.json",
        type: "integer",
        minimum: 1,
      }
      const v1 = ajv.compile(schema)
      const v2 = ajv.compile(schema)
      v1.should.equal(v2)
    })

    it("should throw if different schema has the same id", () => {
      ajv.compile({$id: "//e.com/int.json", type: "integer"})
      should.throw(() => {
        ajv.compile({$id: "//e.com/int.json", type: "integer", minimum: 1})
      }, /already exists/)
    })

    it("should throw if invalid schema is compiled", () => {
      should.throw(() => {
        ajv.compile({type: null})
      }, /should be equal to one of the allowed values/)
    })

    it("should throw if compiled schema has an invalid JavaScript code", () => {
      const _ajv = new _Ajv({logger: false})
      _ajv.addKeyword({keyword: "even", code: badEvenCode})
      let schema = {even: true}
      const validate: any = _ajv.compile(schema)
      validate(2).should.equal(true)
      validate(3).should.equal(false)

      schema = {even: false}
      should.throw(() => {
        _ajv.compile(schema)
      }, /Unexpected token/)

      function badEvenCode(cxt: KeywordCxt) {
        const op = cxt.schema ? _`===` : _`!===` // invalid on purpose
        cxt.pass(_`${cxt.data} % 2 ${op} 0`)
      }
    })
  })

  describe("validate method", () => {
    it("should compile schema and validate data against it", () => {
      ajv.validate({type: "integer"}, 1).should.equal(true)
      ajv.validate({type: "integer"}, "1").should.equal(false)
      ajv.validate({type: "string"}, "a").should.equal(true)
      ajv.validate({type: "string"}, 1).should.equal(false)
    })

    it("should validate against previously compiled schema by id (also see addSchema)", () => {
      ajv.validate({$id: "//e.com/int.json", type: "integer"}, 1).should.equal(true)
      ajv.validate("//e.com/int.json", 1).should.equal(true)
      ajv.validate("//e.com/int.json", "1").should.equal(false)

      ajv.compile({$id: "//e.com/str.json", type: "string"}).should.be.a("function")
      ajv.validate("//e.com/str.json", "a").should.equal(true)
      ajv.validate("//e.com/str.json", 1).should.equal(false)
    })

    it("should throw exception if no schema with ref", () => {
      ajv.validate({$id: "integer", type: "integer"}, 1).should.equal(true)
      ajv.validate("integer", 1).should.equal(true)
      should.throw(() => {
        ajv.validate("string", "foo")
      }, /no schema with key or ref/)
    })

    it("should validate schema fragment by ref", () => {
      ajv.addSchema({
        $id: "http://e.com/types.json",
        definitions: {
          int: {type: "integer"},
          str: {type: "string"},
        },
      })

      ajv.validate("http://e.com/types.json#/definitions/int", 1).should.equal(true)
      ajv.validate("http://e.com/types.json#/definitions/int", "1").should.equal(false)
    })

    it("should return schema fragment by id", () => {
      ajv.addSchema({
        $id: "http://e.com/types.json",
        definitions: {
          int: {$id: "#int", type: "integer"},
          str: {$id: "#str", type: "string"},
        },
      })

      ajv.validate("http://e.com/types.json#int", 1).should.equal(true)
      ajv.validate("http://e.com/types.json#int", "1").should.equal(false)
    })
  })

  describe("addSchema method", () => {
    it("should add and compile schema with key", () => {
      ajv.addSchema({type: "integer"}, "int")
      const validate = ajv.getSchema("int")
      assert(typeof validate == "function")

      validate(1).should.equal(true)
      validate(1.1).should.equal(false)
      validate("1").should.equal(false)
      ajv.validate("int", 1).should.equal(true)
      ajv.validate("int", "1").should.equal(false)
    })

    it("should add and compile schema without key", () => {
      ajv.addSchema({type: "integer"})
      ajv.validate("", 1).should.equal(true)
      ajv.validate("", "1").should.equal(false)
    })

    it("should add and compile schema with id", () => {
      ajv.addSchema({$id: "//e.com/int.json", type: "integer"})
      ajv.validate("//e.com/int.json", 1).should.equal(true)
      ajv.validate("//e.com/int.json", "1").should.equal(false)
    })

    it("should normalize schema keys and ids", () => {
      ajv.addSchema({$id: "//e.com/int.json#", type: "integer"}, "int#")
      ajv.validate("int", 1).should.equal(true)
      ajv.validate("int", "1").should.equal(false)
      ajv.validate("//e.com/int.json", 1).should.equal(true)
      ajv.validate("//e.com/int.json", "1").should.equal(false)
      ajv.validate("int#/", 1).should.equal(true)
      ajv.validate("int#/", "1").should.equal(false)
      ajv.validate("//e.com/int.json#/", 1).should.equal(true)
      ajv.validate("//e.com/int.json#/", "1").should.equal(false)
    })

    it("should add and compile array of schemas with ids", () => {
      ajv.addSchema([
        {$id: "//e.com/int.json", type: "integer"},
        {$id: "//e.com/str.json", type: "string"},
      ])

      const validate0 = ajv.getSchema("//e.com/int.json")
      const validate1 = ajv.getSchema("//e.com/str.json")
      assert(typeof validate0 == "function")
      assert(typeof validate1 == "function")

      validate0(1).should.equal(true)
      validate0("1").should.equal(false)
      validate1("a").should.equal(true)
      validate1(1).should.equal(false)

      ajv.validate("//e.com/int.json", 1).should.equal(true)
      ajv.validate("//e.com/int.json", "1").should.equal(false)
      ajv.validate("//e.com/str.json", "a").should.equal(true)
      ajv.validate("//e.com/str.json", 1).should.equal(false)
    })

    it("should throw on duplicate key", () => {
      ajv.addSchema({type: "integer"}, "int")
      should.throw(() => {
        ajv.addSchema({type: "integer", minimum: 1}, "int")
      }, /already exists/)
    })

    it("should throw on duplicate normalized key", () => {
      ajv.addSchema({type: "number"}, "num")
      should.throw(() => {
        ajv.addSchema({type: "integer"}, "num#")
      }, /already exists/)
      should.throw(() => {
        ajv.addSchema({type: "integer"}, "num#/")
      }, /already exists/)
    })

    it("should allow only one schema without key and id", () => {
      ajv.addSchema({type: "number"})
      should.throw(() => {
        ajv.addSchema({type: "integer"})
      }, /already exists/)
      should.throw(() => {
        ajv.addSchema({type: "integer"}, "")
      }, /already exists/)
      should.throw(() => {
        ajv.addSchema({type: "integer"}, "#")
      }, /already exists/)
    })

    it("should throw if schema is not an object", () => {
      should.throw(() => {
        // @ts-expect-error
        ajv.addSchema("foo")
      }, /schema must be object or boolean/)
    })

    it("should throw if schema id is not a string", () => {
      try {
        // @ts-expect-error
        ajv.addSchema({$id: 1, type: "integer"})
        throw new Error("should have throw exception")
      } catch (e) {
        e.message.should.equal("schema id must be string")
      }
    })

    it("should return instance of itself", () => {
      const res = ajv.addSchema({type: "integer"}, "int")
      res.should.equal(ajv)
    })
  })

  describe("getSchema method", () => {
    it("should return compiled schema by key", () => {
      ajv.addSchema({type: "integer"}, "int")
      const validate = ajv.getSchema("int")
      assert(typeof validate == "function")
      validate(1).should.equal(true)
      validate("1").should.equal(false)
    })

    it("should return compiled schema by id or ref", () => {
      ajv.addSchema({$id: "//e.com/int.json", type: "integer"})
      const validate = ajv.getSchema("//e.com/int.json")
      assert(typeof validate == "function")
      validate(1).should.equal(true)
      validate("1").should.equal(false)
    })

    it("should return compiled schema without key or with empty key", () => {
      ajv.addSchema({type: "integer"})
      const validate = ajv.getSchema("")
      assert(typeof validate == "function")
      validate(1).should.equal(true)
      validate("1").should.equal(false)
    })

    it("should return schema fragment by ref", () => {
      ajv.addSchema({
        $id: "http://e.com/types.json",
        definitions: {
          int: {type: "integer"},
          str: {type: "string"},
        },
      })

      const vInt = ajv.getSchema("http://e.com/types.json#/definitions/int")
      assert(typeof vInt == "function")
      vInt(1).should.equal(true)
      vInt("1").should.equal(false)
    })

    it("should return schema fragment by ref with protocol-relative URIs", () => {
      ajv.addSchema({
        $id: "//e.com/types.json",
        definitions: {
          int: {type: "integer"},
          str: {type: "string"},
        },
      })

      const vInt = ajv.getSchema("//e.com/types.json#/definitions/int")
      assert(typeof vInt == "function")
      vInt(1).should.equal(true)
      vInt("1").should.equal(false)
    })

    it("should return schema fragment by id", () => {
      ajv.addSchema({
        $id: "http://e.com/types.json",
        definitions: {
          int: {$id: "#int", type: "integer"},
          str: {$id: "#str", type: "string"},
        },
      })

      const vInt = ajv.getSchema("http://e.com/types.json#int")
      assert(typeof vInt == "function")
      vInt(1).should.equal(true)
      vInt("1").should.equal(false)
    })
  })

  describe("removeSchema method", () => {
    it("should remove schema by key", () => {
      const schema = {type: "integer"}
      ajv.addSchema(schema, "int")
      const v = ajv.getSchema("int")
      assert(typeof v == "function")
      v.should.be.a("function")
      //@ts-expect-error
      ajv._cache.get(schema).validate.should.equal(v)

      ajv.removeSchema("int")
      should.not.exist(ajv.getSchema("int"))
      //@ts-expect-error
      should.not.exist(ajv._cache.get(schema))
    })

    it("should remove schema by id", () => {
      const schema = {$id: "//e.com/int.json", type: "integer"}
      ajv.addSchema(schema)

      const v = ajv.getSchema("//e.com/int.json")
      assert(typeof v == "function")
      v.should.be.a("function")
      //@ts-expect-error
      ajv._cache.get(schema).validate.should.equal(v)

      ajv.removeSchema("//e.com/int.json")
      should.not.exist(ajv.getSchema("//e.com/int.json"))
      //@ts-expect-error
      should.not.exist(ajv._cache.get(schema))
    })

    it("should remove schema by schema object", () => {
      const schema = {type: "integer"}
      ajv.addSchema(schema)
      //@ts-expect-error
      ajv._cache.get(schema).should.be.an("object")
      ajv.removeSchema(schema)
      //@ts-expect-error
      should.not.exist(ajv._cache.get(schema))
    })

    it("should remove schema with id by schema object", () => {
      const schema = {$id: "//e.com/int.json", type: "integer"}
      ajv.addSchema(schema)
      //@ts-expect-error
      ajv._cache.get(schema).should.be.an("object")
      ajv.removeSchema(schema)
      should.not.exist(ajv.getSchema("//e.com/int.json"))
      //@ts-expect-error
      should.not.exist(ajv._cache.get(schema))
    })

    it("should not throw if there is no schema with passed id", () => {
      should.not.exist(ajv.getSchema("//e.com/int.json"))
      should.not.throw(() => {
        ajv.removeSchema("//e.com/int.json")
      })
    })

    it("should remove all schemas but meta-schemas if called without an arguments", () => {
      const schema1 = {$id: "//e.com/int.json", type: "integer"}
      ajv.addSchema(schema1)
      //@ts-expect-error
      ajv._cache.get(schema1).should.be.an("object")

      const schema2 = {type: "integer"}
      ajv.addSchema(schema2)
      //@ts-expect-error
      ajv._cache.get(schema2).should.be.an("object")

      ajv.removeSchema()
      //@ts-expect-error
      should.not.exist(ajv._cache.get(schema1))
      //@ts-expect-error
      should.not.exist(ajv._cache.get(schema2))
    })

    it("should remove all schemas but meta-schemas with key/id matching pattern", () => {
      const schema1 = {$id: "//e.com/int.json", type: "integer"}
      ajv.addSchema(schema1)
      //@ts-expect-error
      ajv._cache.get(schema1).should.be.an("object")

      const schema2 = {$id: "str.json", type: "string"}
      ajv.addSchema(schema2, "//e.com/str.json")
      //@ts-expect-error
      ajv._cache.get(schema2).should.be.an("object")

      const schema3 = {type: "integer"}
      ajv.addSchema(schema3)
      //@ts-expect-error
      ajv._cache.get(schema3).should.be.an("object")

      ajv.removeSchema(/e\.com/)
      //@ts-expect-error
      should.not.exist(ajv._cache.get(schema1))
      //@ts-expect-error
      should.not.exist(ajv._cache.get(schema2))
      //@ts-expect-error
      ajv._cache.get(schema3).should.be.an("object")
    })

    it("should return instance of itself", () => {
      const res = ajv.addSchema({type: "integer"}, "int").removeSchema("int")
      res.should.equal(ajv)
    })
  })

  describe("addFormat method", () => {
    it("should add format as regular expression", () => {
      ajv.addFormat("identifier", /^[a-z_$][a-z0-9_$]*$/i)
      testFormat()
    })

    it("should add format as string", () => {
      ajv.addFormat("identifier", "^[A-Za-z_$][A-Za-z0-9_$]*$")
      testFormat()
    })

    it("should add format as function", () => {
      ajv.addFormat("identifier", (str) => /^[a-z_$][a-z0-9_$]*$/i.test(str))
      testFormat()
    })

    it("should add format as object", () => {
      ajv.addFormat("identifier", {
        validate: (str: string) => /^[a-z_$][a-z0-9_$]*$/i.test(str),
      })
      testFormat()
    })

    it("should return instance of itself", () => {
      const res = ajv.addFormat("identifier", /^[a-z_$][a-z0-9_$]*$/i)
      res.should.equal(ajv)
    })

    function testFormat() {
      const validate = ajv.compile({
        type: ["number", "string"],
        format: "identifier",
      })
      validate("Abc1").should.equal(true)
      validate("123").should.equal(false)
      validate(123).should.equal(true)
    }

    describe("formats for number", () => {
      it("should validate only numbers", () => {
        ajv.addFormat("positive", {
          type: "number",
          validate: function (x: number) {
            return x > 0
          },
        })

        const validate = ajv.compile({
          type: ["string", "number"],
          format: "positive",
        })
        validate(-2).should.equal(false)
        validate(0).should.equal(false)
        validate(2).should.equal(true)
        validate("abc").should.equal(true)
      })

      it("should validate numbers with format via $data", () => {
        ajv = new _Ajv({$data: true, allowUnionTypes: true})
        ajv.addFormat("positive", {
          type: "number",
          validate: function (x: number) {
            return x > 0
          },
        })

        const validate = ajv.compile({
          type: "object",
          properties: {
            data: {
              type: ["number", "string"],
              format: {$data: "1/frmt"},
            },
            frmt: {type: "string"},
          },
        })
        validate({data: -2, frmt: "positive"}).should.equal(false)
        validate({data: 0, frmt: "positive"}).should.equal(false)
        validate({data: 2, frmt: "positive"}).should.equal(true)
        validate({data: "abc", frmt: "positive"}).should.equal(true)
      })
    })
  })

  describe("validateSchema method", () => {
    it("should validate schema against meta-schema", () => {
      let valid = ajv.validateSchema({
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "number",
      })

      valid.should.equal(true)
      should.equal(ajv.errors, null)

      valid = ajv.validateSchema({
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "wrong_type",
      })

      valid.should.equal(false)
      assert(Array.isArray(ajv.errors))
      ajv.errors.length.should.equal(3)
      ajv.errors[0].keyword.should.equal("enum")
      ajv.errors[1].keyword.should.equal("type")
      ajv.errors[2].keyword.should.equal("anyOf")
    })

    it("should throw exception if meta-schema is unknown", () => {
      should.throw(() => {
        ajv.validateSchema({
          $schema: "http://example.com/unknown/schema#",
          type: "number",
        })
      }, /no schema with key or ref/)
    })

    it("should throw exception if $schema is not a string", () => {
      should.throw(() => {
        ajv.validateSchema({
          //@ts-expect-error
          $schema: {},
          type: "number",
        })
      }, /\$schema must be a string/)
    })

    describe("sub-schema validation outside of definitions during compilation", () => {
      it("maximum", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {type: "number", maximum: "bar"},
        })
      })

      it("exclusiveMaximum", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {type: "number", exclusiveMaximum: "bar"},
        })
      })

      it("maxItems", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {type: "array", maxItems: "bar"},
        })
      })

      it("maxLength", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {type: "string", maxLength: "bar"},
        })
      })

      it("maxProperties", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {type: "object", maxProperties: "bar"},
        })
      })

      it("multipleOf", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {type: "number", multipleOf: "bar"},
        })
      })

      function passValidationThrowCompile(schema: SchemaObject) {
        ajv.validateSchema(schema).should.equal(true)
        should.throw(() => {
          ajv.compile(schema)
        }, /value must be/)
      }
    })
  })
})
