import type {JSONSchemaType} from "../.."
import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

describe("strict mode", () => {
  describe(
    '"additionalItems" without "items"',
    testStrictMode({type: "array", additionalItems: false}, /additionalItems/)
  )

  describe('"if" without "then" and "else"', testStrictMode({if: true}, /if.*then.*else/))

  describe('"then" without "if"', testStrictMode({then: true}, /then.*if/))

  describe('"else" without "if"', testStrictMode({else: true}, /else.*if/))

  describe(
    '"properties" matching "patternProperties"',
    testStrictMode(
      {
        type: "object",
        properties: {foo: false},
        patternProperties: {foo: false},
      },
      /property.*pattern/
    )
  )

  describe('option allowMatchingProperties to allow "properties" matching "patternProperties"', () => {
    it("should NOT throw an error or log a warning", () => {
      const output: any = {}
      const ajv = new _Ajv({
        allowMatchingProperties: true,
        logger: getLogger(output),
      })
      const schema = {
        type: "object",
        properties: {foo: false},
        patternProperties: {foo: false},
      }
      ajv.compile(schema)
      should.not.exist(output.warning)
    })
  })

  describe("strictTypes option", () => {
    const ajv = new _Ajv({strictTypes: true})
    const ajvUT = new _Ajv({strictTypes: true, allowUnionTypes: true})

    describe("multiple/union types", () => {
      it("should prohibit multiple types", () => {
        should.throw(() => {
          ajv.compile({type: ["number", "string"]})
        }, /use allowUnionTypes to allow union type/)
      })

      it("should allow multiple types with option allowUnionTypes", () => {
        should.not.throw(() => {
          ajvUT.compile({type: ["number", "string"]})
        })
      })

      it("should allow nullable", () => {
        should.not.throw(() => {
          ajv.compile({type: ["number", "null"]})
          ajv.compile({type: ["number"], nullable: true})
        })
      })
    })

    describe("contradictory types", () => {
      it("should prohibit contradictory types", () => {
        should.throw(() => {
          ajv.compile({
            type: "object",
            anyOf: [{type: "object"}, {type: "array"}],
          })
        }, /type "array" not allowed by context "object"/)
      })

      it("should allow narrowing types", () => {
        should.not.throw(() => {
          ajvUT.compile({
            type: ["object", "array"],
            anyOf: [{type: "object"}, {type: "array"}],
          })
        })
      })

      it('should allow "integer" in "number" context', () => {
        should.not.throw(() => {
          ajv.compile({
            type: "number",
            anyOf: [{type: "integer"}],
          })
        })
      })

      it('should prohibit "number" in "integer" context', () => {
        should.throw(() => {
          ajv.compile({
            type: "integer",
            anyOf: [{type: "number"}],
          })
        }, /type "number" not allowed by context "integer"/)
      })
    })

    describe("applicable types", () => {
      it("should prohibit keywords without applicable types", () => {
        should.throw(() => {
          ajv.compile({
            properties: {
              foo: {type: "number", minimum: 0},
            },
          })
        }, /missing type "object" for keyword "properties"/)

        should.throw(() => {
          ajv.compile({
            type: "object",
            properties: {
              foo: {minimum: 0},
            },
          })
        }, /missing type "number" for keyword "minimum"/)
      })

      it("should allow keywords with applicable types", () => {
        should.not.throw(() => {
          ajv.compile({
            type: "object",
            properties: {
              foo: {type: "number", minimum: 0},
            },
          })
        })
      })

      it("should allow keywords with applicable type in parent schema", () => {
        should.not.throw(() => {
          ajv.compile({
            type: "object",
            anyOf: [
              {
                properties: {
                  foo: {type: "number"},
                },
              },
              {
                properties: {
                  bar: {type: "string"},
                },
              },
            ],
          })
        })
      })
    })

    describe("propertyNames", () => {
      it('should set default data type "string"', () => {
        ajv.compile({
          type: "object",
          propertyNames: {maxLength: 5},
        })

        ajv.compile({
          type: "object",
          propertyNames: {type: "string", maxLength: 5},
        })

        should.throw(() => {
          ajv.compile({
            type: "object",
            propertyNames: {type: "number"},
          })
        }, /type "number" not allowed by context/)
      })
    })
  })

  describe("option strictTuples", () => {
    const ajv = new _Ajv({strictTuples: true})
    type MyTuple = [string, number]

    it("should prohibit unconstrained tuples", () => {
      const schema1: JSONSchemaType<MyTuple> = {
        type: "array",
        items: [{type: "string"}, {type: "number"}],
        minItems: 2,
        additionalItems: false,
      }
      should.not.throw(() => {
        ajv.compile(schema1)
      })

      const schema2: JSONSchemaType<MyTuple> = {
        type: "array",
        items: [{type: "string"}, {type: "number"}],
        minItems: 2,
        maxItems: 2,
      }
      should.not.throw(() => {
        ajv.compile(schema2)
      })

      //@ts-expect-error
      const badSchema1: JSONSchemaType<MyTuple> = {
        type: "array",
        items: [{type: "string"}, {type: "number"}],
        additionalItems: false,
      }
      should.throw(() => {
        ajv.compile(badSchema1)
      }, / minItems or maxItems\/additionalItems are not specified or different/)

      //@ts-expect-error
      const badSchema2: JSONSchemaType<MyTuple> = {
        type: "array",
        items: [{type: "string"}, {type: "number"}],
        minItems: 2,
      }
      should.throw(() => {
        ajv.compile(badSchema2)
      }, / minItems or maxItems\/additionalItems are not specified or different/)

      //@ts-expect-error
      const badSchema3: JSONSchemaType<MyTuple> = {
        type: "array",
        items: [{type: "string"}, {type: "number"}],
        minItems: 2,
        maxItems: 3,
      }
      should.throw(() => {
        ajv.compile(badSchema3)
      }, / minItems or maxItems\/additionalItems are not specified or different/)
    })
  })

  describe("strictRequired option", () => {
    const ajv = new _Ajv({strictRequired: true, strict: true})

    describe("base case", () => {
      const schema = {
        type: "object",
        properties: {
          notTest: {
            type: "string",
          },
        },
        required: ["test"],
      }

      it("should prohibit with strictRequired: true", () => {
        should.throw(
          () => ajv.compile(schema),
          'strict mode: required property "test" is not defined at "#" (strictRequired)'
        )
      })

      it("should NOT prohibit when strictRequired is not set", () => {
        should.not.throw(() => new _Ajv().compile(schema))
      })
    })

    it("should prohibit in second level of a schema", () => {
      should.throw(() => {
        ajv.compile({
          type: "object",
          properties: {
            test: {
              type: "object",
              properties: {},
              required: ["keyname"],
            },
          },
        })
      }, 'strict mode: required property "keyname" is not defined at "#/properties/test" (strictRequired)')
    })

    it.skip("should not throw with a same level if then", () => {
      should.not.throw(() => {
        ajv.compile({
          type: "object",
          properties: {foo: {}},
          if: {required: ["foo"]},
          then: {properties: {bar: {type: "boolean"}}},
        })
      })
    })

    it("should throw if a required property exists in a parent object but not in the subschema that the require keyword references", () => {
      should.throw(() => {
        ajv.compile({
          type: "object",
          properties: {
            foo: {
              type: "object",
              required: "foo",
              properties: {
                test: {
                  type: "integer",
                },
              },
            },
          },
        })
      })
    })

    it("should throw if property exists in parent but not in actual object required references", () => {
      should.throw(() => {
        ajv.compile({
          type: "object",
          properties: {
            foo: {
              type: "object",
              required: "foo",
              properties: {
                test: {
                  type: "number",
                },
              },
            },
          },
        })
      })
    })

    it.skip("should not throw because all referenced properties are defined", () => {
      should.not.throw(() => {
        ajv.compile({
          type: "object",
          properties: {foo: {}, bar: {}},
          allOf: [
            {
              allOf: [
                {
                  if: {required: ["foo"]},
                  then: {required: ["bar"]},
                },
              ],
            },
          ],
        })
      })
    })

    it("should throw because baz does not exist as a property", () => {
      should.throw(() => {
        ajv.compile({
          type: "object",
          properties: {foo: {}, bar: {}},
          allOf: [
            {
              allOf: [
                {
                  if: {required: ["bar"]},
                  then: {required: ["baz"]},
                },
              ],
            },
          ],
        })
      })
    })
  })
})

function testStrictMode(schema, logPattern) {
  return () => {
    describe("strict = false", () => {
      it("should NOT throw an error or log a warning", () => {
        const output: any = {}
        const ajv = new _Ajv({
          strict: false,
          logger: getLogger(output),
        })
        ajv.compile(schema)
        should.not.exist(output.warning)
      })
    })

    describe("strict = true or undefined", () => {
      it("should throw an error", () => {
        test(new _Ajv({strict: true}))
        test(new _Ajv())

        function test(ajv) {
          should.throw(() => {
            ajv.compile(schema)
          }, logPattern)
        }
      })
    })

    describe('strict = "log"', () => {
      it("should log a warning", () => {
        const output: any = {}
        const ajv = new _Ajv({
          strict: "log",
          logger: getLogger(output),
        })
        ajv.compile(schema)
        output.warning.should.match(logPattern)
      })
    })
  }
}

function getLogger(output) {
  return {
    log() {
      throw new Error("log should not be called")
    },
    warn(msg) {
      output.warning = msg
    },
    error() {
      throw new Error("error should not be called")
    },
  }
}
