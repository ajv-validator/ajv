import _Ajv from "./ajv"
import type Ajv from ".."
import chai from "./chai"
chai.should()

describe("boolean schemas", () => {
  let ajvs: Ajv[]

  before(() => {
    ajvs = [
      new _Ajv({strictTuples: false}),
      new _Ajv({allErrors: true, strictTuples: false}),
      new _Ajv({inlineRefs: false, strictTuples: false}),
      new _Ajv({strict: false, strictTuples: false}),
    ]
  })

  describe("top level schema", () => {
    describe("schema = true", () => {
      it("should validate any data as valid", () => {
        ajvs.forEach(test(true, true))
      })
    })

    describe("schema = false", () => {
      it("should validate any data as invalid", () => {
        ajvs.forEach(test(false, false))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        const validate = ajv.compile(boolSchema)
        testSchema(validate, valid)
      }
    }
  })

  describe("in properties / sub-properties", () => {
    describe("schema = true", () => {
      it("should be valid with any property value", () => {
        ajvs.forEach(test(true, true))
      })
    })

    describe("schema = false", () => {
      it("should be invalid with any property value", () => {
        ajvs.forEach(test(false, false))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        const schema = {
          type: "object",
          properties: {
            foo: boolSchema,
            bar: {
              type: "object",
              properties: {
                baz: boolSchema,
              },
            },
          },
        }

        const validate = ajv.compile(schema)
        validate({foo: 1, bar: {baz: 1}}).should.equal(valid)
        validate({foo: "1", bar: {baz: "1"}}).should.equal(valid)
        validate({foo: {}, bar: {baz: {}}}).should.equal(valid)
        validate({foo: [], bar: {baz: []}}).should.equal(valid)
        validate({foo: true, bar: {baz: true}}).should.equal(valid)
        validate({foo: false, bar: {baz: false}}).should.equal(valid)
        validate({foo: null, bar: {baz: null}}).should.equal(valid)

        validate({bar: {quux: 1}}).should.equal(true)
      }
    }
  })

  describe("in items / sub-items", () => {
    describe("schema = true", () => {
      it("should be valid with any item value", () => {
        ajvs.forEach(test(true, true))
      })
    })

    describe("schema = false", () => {
      it("should be invalid with any item value", () => {
        ajvs.forEach(test(false, false))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        let schema = {
          type: "array",
          items: boolSchema,
        }

        let validate = ajv.compile(schema)
        validate([1]).should.equal(valid)
        validate(["1"]).should.equal(valid)
        validate([{}]).should.equal(valid)
        validate([[]]).should.equal(valid)
        validate([true]).should.equal(valid)
        validate([false]).should.equal(valid)
        validate([null]).should.equal(valid)

        validate([]).should.equal(true)

        schema = {
          type: "array",
          items: [
            true,
            {
              type: "array",
              items: [true, boolSchema],
            },
            boolSchema,
          ],
        }

        validate = ajv.compile(schema)
        validate([1, [1, 1], 1]).should.equal(valid)
        validate(["1", ["1", "1"], "1"]).should.equal(valid)
        validate([{}, [{}, {}], {}]).should.equal(valid)
        validate([[], [[], []], []]).should.equal(valid)
        validate([true, [true, true], true]).should.equal(valid)
        validate([false, [false, false], false]).should.equal(valid)
        validate([null, [null, null], null]).should.equal(valid)

        validate([1, [1]]).should.equal(true)
      }
    }
  })

  describe("in dependencies and sub-dependencies", () => {
    describe("schema = true", () => {
      it("should be valid with any property value", () => {
        ajvs.forEach(test(true, true))
      })
    })

    describe("schema = false", () => {
      it("should be invalid with any property value", () => {
        ajvs.forEach(test(false, false))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        const schema = {
          type: "object",
          dependencies: {
            foo: boolSchema,
            bar: {
              type: "object",
              dependencies: {
                baz: boolSchema,
              },
            },
          },
        }

        const validate = ajv.compile(schema)
        validate({foo: 1, bar: 1, baz: 1}).should.equal(valid)
        validate({foo: "1", bar: "1", baz: "1"}).should.equal(valid)
        validate({foo: {}, bar: {}, baz: {}}).should.equal(valid)
        validate({foo: [], bar: [], baz: []}).should.equal(valid)
        validate({foo: true, bar: true, baz: true}).should.equal(valid)
        validate({foo: false, bar: false, baz: false}).should.equal(valid)
        validate({foo: null, bar: null, baz: null}).should.equal(valid)

        validate({bar: 1, quux: 1}).should.equal(true)
      }
    }
  })

  describe("in patternProperties", () => {
    describe("schema = true", () => {
      it("should be valid with any property matching pattern", () => {
        ajvs.forEach(test(true, true))
      })
    })

    describe("schema = false", () => {
      it("should be invalid with any property matching pattern", () => {
        ajvs.forEach(test(false, false))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        const schema = {
          type: "object",
          patternProperties: {
            "^f": boolSchema,
            r$: {
              type: "object",
              patternProperties: {
                z$: boolSchema,
              },
            },
          },
        }

        const validate = ajv.compile(schema)
        validate({foo: 1, bar: {baz: 1}}).should.equal(valid)
        validate({foo: "1", bar: {baz: "1"}}).should.equal(valid)
        validate({foo: {}, bar: {baz: {}}}).should.equal(valid)
        validate({foo: [], bar: {baz: []}}).should.equal(valid)
        validate({foo: true, bar: {baz: true}}).should.equal(valid)
        validate({foo: false, bar: {baz: false}}).should.equal(valid)
        validate({foo: null, bar: {baz: null}}).should.equal(valid)

        validate({bar: {quux: 1}}).should.equal(true)
      }
    }
  })

  describe("in propertyNames", () => {
    describe("schema = true", () => {
      it("should be valid with any property", () => {
        ajvs.forEach(test(true, true))
      })
    })

    describe("schema = false", () => {
      it("should be invalid with any property", () => {
        ajvs.forEach(test(false, false))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        const schema = {
          type: "object",
          propertyNames: boolSchema,
        }

        const validate = ajv.compile(schema)
        validate({foo: 1}).should.equal(valid)
        validate({bar: 1}).should.equal(valid)

        validate({}).should.equal(true)
      }
    }
  })

  describe("in contains", () => {
    describe("schema = true", () => {
      it("should be valid with any items", () => {
        ajvs.forEach(test(true, true))
      })
    })

    describe("schema = false", () => {
      it("should be invalid with any items", () => {
        ajvs.forEach(test(false, false))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        const schema = {
          type: "array",
          contains: boolSchema,
        }

        const validate = ajv.compile(schema)
        validate([1]).should.equal(valid)
        validate(["foo"]).should.equal(valid)
        validate([{}]).should.equal(valid)
        validate([[]]).should.equal(valid)
        validate([true]).should.equal(valid)
        validate([false]).should.equal(valid)
        validate([null]).should.equal(valid)

        validate([]).should.equal(false)
      }
    }
  })

  describe("in not", () => {
    describe("schema = true", () => {
      it("should be invalid with any data", () => {
        ajvs.forEach(test(true, false))
      })
    })

    describe("schema = false", () => {
      it("should be valid with any data", () => {
        ajvs.forEach(test(false, true))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        const schema = {
          not: boolSchema,
        }

        const validate = ajv.compile(schema)
        testSchema(validate, valid)
      }
    }
  })

  describe("in allOf", () => {
    describe("schema = true", () => {
      it("should be valid with any data", () => {
        ajvs.forEach(test(true, true))
      })
    })

    describe("schema = false", () => {
      it("should be invalid with any data", () => {
        ajvs.forEach(test(false, false))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        let schema = {
          allOf: [false, boolSchema],
        }

        let validate = ajv.compile(schema)
        testSchema(validate, false)

        schema = {
          allOf: [true, boolSchema],
        }

        validate = ajv.compile(schema)
        testSchema(validate, valid)
      }
    }
  })

  describe("in anyOf", () => {
    describe("schema = true", () => {
      it("should be valid with any data", () => {
        ajvs.forEach(test(true, true))
      })
    })

    describe("schema = false", () => {
      it("should be invalid with any data", () => {
        ajvs.forEach(test(false, false))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        let schema = {
          anyOf: [false, boolSchema],
        }

        let validate = ajv.compile(schema)
        testSchema(validate, valid)

        schema = {
          anyOf: [true, boolSchema],
        }

        validate = ajv.compile(schema)
        testSchema(validate, true)
      }
    }
  })

  describe("in oneOf", () => {
    describe("schema = true", () => {
      it("should be valid with any data", () => {
        ajvs.forEach(test(true, true))
      })
    })

    describe("schema = false", () => {
      it("should be invalid with any data", () => {
        ajvs.forEach(test(false, false))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        let schema = {
          oneOf: [false, boolSchema],
        }

        let validate = ajv.compile(schema)
        testSchema(validate, valid)

        schema = {
          oneOf: [true, boolSchema],
        }

        validate = ajv.compile(schema)
        testSchema(validate, !valid)
      }
    }
  })

  describe("in $ref", () => {
    describe("schema = true", () => {
      it("should be valid with any data", () => {
        ajvs.forEach(test(true, true))
      })
    })

    describe("schema = false", () => {
      it("should be invalid with any data", () => {
        ajvs.forEach(test(false, false))
      })
    })

    function test(boolSchema, valid) {
      return function (ajv) {
        const schema = {
          $ref: "#/definitions/bool",
          definitions: {
            bool: boolSchema,
          },
        }

        const validate = ajv.compile(schema)
        testSchema(validate, valid)
      }
    }
  })

  function testSchema(validate, valid) {
    validate(1).should.equal(valid)
    validate("foo").should.equal(valid)
    validate({}).should.equal(valid)
    validate([]).should.equal(valid)
    validate(true).should.equal(valid)
    validate(false).should.equal(valid)
    validate(null).should.equal(valid)
  }
})
