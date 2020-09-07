import _Ajv from "./ajv"
import stableStringify from "fast-json-stable-stringify"
import {_} from "../dist/compile/codegen"
const should = require("./chai").should()

describe("Ajv", () => {
  let ajv

  beforeEach(() => {
    ajv = new _Ajv()
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
      const v1 = ajv.compile({
        $id: "//e.com/int.json",
        type: "integer",
        minimum: 1,
      })
      const v2 = ajv.compile({
        $id: "//e.com/int.json",
        minimum: 1,
        type: "integer",
      })
      v1.should.equal(v2)
    })

    it("should throw if different schema has the same id", () => {
      ajv.compile({$id: "//e.com/int.json", type: "integer"})
      should.throw(() => {
        ajv.compile({$id: "//e.com/int.json", type: "integer", minimum: 1})
      })
    })

    it("should throw if invalid schema is compiled", () => {
      should.throw(() => {
        ajv.compile({type: null})
      })
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
      })

      function badEvenCode(cxt) {
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
      })
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
      validate.should.be.a("function")

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
      })
    })

    it("should throw on duplicate normalized key", () => {
      ajv.addSchema({type: "number"}, "num")
      should.throw(() => {
        ajv.addSchema({type: "integer"}, "num#")
      })
      should.throw(() => {
        ajv.addSchema({type: "integer"}, "num#/")
      })
    })

    it("should allow only one schema without key and id", () => {
      ajv.addSchema({type: "number"})
      should.throw(() => {
        ajv.addSchema({type: "integer"})
      })
      should.throw(() => {
        ajv.addSchema({type: "integer"}, "")
      })
      should.throw(() => {
        ajv.addSchema({type: "integer"}, "#")
      })
    })

    it("should throw if schema is not an object", () => {
      should.throw(() => {
        ajv.addSchema("foo")
      })
    })

    it("should throw if schema id is not a string", () => {
      try {
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
      validate(1).should.equal(true)
      validate("1").should.equal(false)
    })

    it("should return compiled schema by id or ref", () => {
      ajv.addSchema({$id: "//e.com/int.json", type: "integer"})
      const validate = ajv.getSchema("//e.com/int.json")
      validate(1).should.equal(true)
      validate("1").should.equal(false)
    })

    it("should return compiled schema without key or with empty key", () => {
      ajv.addSchema({type: "integer"})
      const validate = ajv.getSchema("")
      validate(1).should.equal(true)
      validate("1").should.equal(false)

      const v = ajv.getSchema()
      v(1).should.equal(true)
      v("1").should.equal(false)
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
      vInt(1).should.equal(true)
      vInt("1").should.equal(false)
    })
  })

  describe("removeSchema method", () => {
    it("should remove schema by key", () => {
      const schema = {type: "integer"},
        str = stableStringify(schema)
      ajv.addSchema(schema, "int")
      const v = ajv.getSchema("int")

      v.should.be.a("function")
      ajv._cache.get(str).validate.should.equal(v)

      ajv.removeSchema("int")
      should.not.exist(ajv.getSchema("int"))
      should.not.exist(ajv._cache.get(str))
    })

    it("should remove schema by id", () => {
      const schema = {$id: "//e.com/int.json", type: "integer"},
        str = stableStringify(schema)
      ajv.addSchema(schema)

      const v = ajv.getSchema("//e.com/int.json")
      v.should.be.a("function")
      ajv._cache.get(str).validate.should.equal(v)

      ajv.removeSchema("//e.com/int.json")
      should.not.exist(ajv.getSchema("//e.com/int.json"))
      should.not.exist(ajv._cache.get(str))
    })

    it("should remove schema by schema object", () => {
      const schema = {type: "integer"},
        str = stableStringify(schema)
      ajv.addSchema(schema)
      ajv._cache.get(str).should.be.an("object")
      ajv.removeSchema({type: "integer"})
      should.not.exist(ajv._cache.get(str))
    })

    it("should remove schema with id by schema object", () => {
      const schema = {$id: "//e.com/int.json", type: "integer"},
        str = stableStringify(schema)
      ajv.addSchema(schema)
      ajv._cache.get(str).should.be.an("object")
      ajv.removeSchema({$id: "//e.com/int.json", type: "integer"})
      // should.not.exist(ajv.getSchema('//e.com/int.json'));
      should.not.exist(ajv._cache.get(str))
    })

    it("should not throw if there is no schema with passed id", () => {
      should.not.exist(ajv.getSchema("//e.com/int.json"))
      should.not.throw(() => {
        ajv.removeSchema("//e.com/int.json")
      })
    })

    it("should remove all schemas but meta-schemas if called without an arguments", () => {
      const schema1 = {$id: "//e.com/int.json", type: "integer"},
        str1 = stableStringify(schema1)
      ajv.addSchema(schema1)
      ajv._cache.get(str1).should.be.an("object")

      const schema2 = {type: "integer"},
        str2 = stableStringify(schema2)
      ajv.addSchema(schema2)
      ajv._cache.get(str2).should.be.an("object")

      ajv.removeSchema()
      should.not.exist(ajv._cache.get(str1))
      should.not.exist(ajv._cache.get(str2))
    })

    it("should remove all schemas but meta-schemas with key/id matching pattern", () => {
      const schema1 = {$id: "//e.com/int.json", type: "integer"},
        str1 = stableStringify(schema1)
      ajv.addSchema(schema1)
      ajv._cache.get(str1).should.be.an("object")

      const schema2 = {$id: "str.json", type: "string"},
        str2 = stableStringify(schema2)
      ajv.addSchema(schema2, "//e.com/str.json")
      ajv._cache.get(str2).should.be.an("object")

      const schema3 = {type: "integer"},
        str3 = stableStringify(schema3)
      ajv.addSchema(schema3)
      ajv._cache.get(str3).should.be.an("object")

      ajv.removeSchema(/e\.com/)
      should.not.exist(ajv._cache.get(str1))
      should.not.exist(ajv._cache.get(str2))
      ajv._cache.get(str3).should.be.an("object")
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
        validate: (str) => /^[a-z_$][a-z0-9_$]*$/i.test(str),
      })
      testFormat()
    })

    it("should return instance of itself", () => {
      const res = ajv.addFormat("identifier", /^[a-z_$][a-z0-9_$]*$/i)
      res.should.equal(ajv)
    })

    function testFormat() {
      const validate = ajv.compile({format: "identifier"})
      validate("Abc1").should.equal(true)
      validate("123").should.equal(false)
      validate(123).should.equal(true)
    }

    describe("formats for number", () => {
      it("should validate only numbers", () => {
        ajv.addFormat("positive", {
          type: "number",
          validate: function (x) {
            return x > 0
          },
        })

        const validate = ajv.compile({
          format: "positive",
        })
        validate(-2).should.equal(false)
        validate(0).should.equal(false)
        validate(2).should.equal(true)
        validate("abc").should.equal(true)
      })

      it("should validate numbers with format via $data", () => {
        ajv = new _Ajv({$data: true})
        ajv.addFormat("positive", {
          type: "number",
          validate: function (x) {
            return x > 0
          },
        })

        const validate = ajv.compile({
          properties: {
            data: {format: {$data: "1/frmt"}},
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
      })
    })

    it("should throw exception if $schema is not a string", () => {
      should.throw(() => {
        ajv.validateSchema({
          $schema: {},
          type: "number",
        })
      })
    })

    describe("sub-schema validation outside of definitions during compilation", () => {
      it("maximum", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {maximum: "bar"},
        })
      })

      it("exclusiveMaximum", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {exclusiveMaximum: "bar"},
        })
      })

      it("maxItems", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {maxItems: "bar"},
        })
      })

      it("maxLength", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {maxLength: "bar"},
        })
      })

      it("maxProperties", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {maxProperties: "bar"},
        })
      })

      it("multipleOf", () => {
        passValidationThrowCompile({
          $ref: "#/foo",
          foo: {maxProperties: "bar"},
        })
      })

      function passValidationThrowCompile(schema) {
        ajv.validateSchema(schema).should.equal(true)
        should.throw(() => {
          ajv.compile(schema)
        })
      }
    })
  })
})
