import type Ajv from ".."
import type {ValidateFunction} from ".."
import _Ajv from "./ajv"
import chai from "./chai"
const should = chai.should()

describe("Validation errors", () => {
  let ajv: Ajv, ajvJP: Ajv, fullAjv: Ajv

  beforeEach(() => {
    createInstances()
  })

  function createInstances() {
    const opts = {
      loopRequired: 21,
      strictTypes: false,
      strictTuples: false,
    }
    ajv = new _Ajv(opts)
    ajvJP = new _Ajv(opts)
    fullAjv = new _Ajv({
      ...opts,
      allErrors: true,
      verbose: true,
      jsPropertySyntax: true, // deprecated
      logger: false,
    })
  }

  it("error should include dataPath", () => {
    const schema = {
      properties: {
        foo: {type: "number"},
      },
    }

    testSchema1(schema)
  })

  it('"refs" error should include dataPath', () => {
    const schema = {
      definitions: {
        num: {type: "number"},
      },
      properties: {
        foo: {$ref: "#/definitions/num"},
      },
    }

    testSchema1(schema, "#/definitions/num")
  })

  describe('"additionalProperties" errors', () => {
    it("should NOT include property in dataPath", () => {
      testAdditional()
    })

    function testAdditional() {
      const schema = {
        properties: {
          foo: {},
          bar: {},
        },
        additionalProperties: false,
      }

      const data = {foo: 1, bar: 2},
        invalidData = {foo: 1, bar: 2, baz: 3, quux: 4}

      const msg = "should NOT have additional properties"

      const validate = ajv.compile(schema)
      shouldBeValid(validate, data)
      shouldBeInvalid(validate, invalidData)
      shouldBeError(
        validate.errors?.[0],
        "additionalProperties",
        "#/additionalProperties",
        "",
        msg,
        {
          additionalProperty: "baz",
        }
      )

      const validateJP = ajvJP.compile(schema)
      shouldBeValid(validateJP, data)
      shouldBeInvalid(validateJP, invalidData)
      shouldBeError(
        validateJP.errors?.[0],
        "additionalProperties",
        "#/additionalProperties",
        "",
        msg,
        {additionalProperty: "baz"}
      )

      const fullValidate = fullAjv.compile(schema)
      shouldBeValid(fullValidate, data)
      shouldBeInvalid(fullValidate, invalidData, 2)
      shouldBeError(
        fullValidate.errors?.[0],
        "additionalProperties",
        "#/additionalProperties",
        "",
        msg,
        {additionalProperty: "baz"}
      )
      shouldBeError(
        fullValidate.errors?.[1],
        "additionalProperties",
        "#/additionalProperties",
        "",
        msg,
        {additionalProperty: "quux"}
      )
    }
  })

  describe('errors when "additionalProperties" is schema', () => {
    it("should NOT include property in dataPath", () => {
      testAdditionalIsSchema()
    })

    function testAdditionalIsSchema() {
      const schema = {
        properties: {
          foo: {type: "integer"},
          bar: {type: "integer"},
        },
        additionalProperties: {
          type: "object",
          properties: {
            quux: {type: "string"},
          },
        },
      }

      const data = {foo: 1, bar: 2, baz: {quux: "abc"}},
        invalidData = {foo: 1, bar: 2, baz: {quux: 3}, boo: {quux: 4}}

      const schPath = "#/additionalProperties/properties/quux/type"

      const validate = ajv.compile(schema)
      shouldBeValid(validate, data)
      shouldBeInvalid(validate, invalidData)
      shouldBeError(validate.errors?.[0], "type", schPath, "/baz/quux", "should be string", {
        type: "string",
      })

      const validateJP = ajvJP.compile(schema)
      shouldBeValid(validateJP, data)
      shouldBeInvalid(validateJP, invalidData)
      shouldBeError(validateJP.errors?.[0], "type", schPath, "/baz/quux", "should be string", {
        type: "string",
      })

      const fullValidate = fullAjv.compile(schema)
      shouldBeValid(fullValidate, data)
      shouldBeInvalid(fullValidate, invalidData, 2)
      shouldBeError(fullValidate.errors?.[0], "type", schPath, "['baz'].quux", "should be string", {
        type: "string",
      })
      shouldBeError(fullValidate.errors?.[1], "type", schPath, "['boo'].quux", "should be string", {
        type: "string",
      })
    }
  })

  describe('"required" errors', () => {
    it("should NOT include missing property in dataPath", () => {
      testRequired()
    })

    function testRequired() {
      const schema = {
        required: ["foo", "bar", "baz"],
      }

      _testRequired(schema, "#")
    }

    it("large data/schemas", () => {
      testRequiredLargeSchema()
    })

    function testRequiredLargeSchema() {
      let schema: any = {required: []}
      const data = {},
        invalidData1 = {},
        invalidData2 = {}
      for (let i = 0; i < 100; i++) {
        schema.required.push("" + i) // properties from '0' to '99' are required
        data[i] = invalidData1[i] = invalidData2[i] = i
      }

      delete invalidData1[1] // property '1' will be missing
      delete invalidData2[2] // properties '2' and '198' will be missing
      delete invalidData2[98]

      test()

      schema = {anyOf: [schema]}
      test(1, "#/anyOf/0")

      function test(extraErrors = 0, schemaPathPrefix = "#") {
        const schPath = schemaPathPrefix + "/required"
        const validate = ajv.compile(schema)
        shouldBeValid(validate, data)
        shouldBeInvalid(validate, invalidData1, 1 + extraErrors)
        shouldBeError(validate.errors?.[0], "required", schPath, "", requiredMsg("1"), {
          missingProperty: "1",
        })
        shouldBeInvalid(validate, invalidData2, 1 + extraErrors)
        shouldBeError(validate.errors?.[0], "required", schPath, "", requiredMsg("2"), {
          missingProperty: "2",
        })

        const validateJP = ajvJP.compile(schema)
        shouldBeValid(validateJP, data)
        shouldBeInvalid(validateJP, invalidData1, 1 + extraErrors)
        shouldBeError(validateJP.errors?.[0], "required", schPath, "", requiredMsg("1"), {
          missingProperty: "1",
        })
        shouldBeInvalid(validateJP, invalidData2, 1 + extraErrors)
        shouldBeError(validateJP.errors?.[0], "required", schPath, "", requiredMsg("2"), {
          missingProperty: "2",
        })

        const fullValidate = fullAjv.compile(schema)
        shouldBeValid(fullValidate, data)
        shouldBeInvalid(fullValidate, invalidData1, 1 + extraErrors)
        shouldBeError(fullValidate.errors?.[0], "required", schPath, "", requiredMsg("1"), {
          missingProperty: "1",
        })
        shouldBeInvalid(fullValidate, invalidData2, 2 + extraErrors)
        shouldBeError(fullValidate.errors?.[0], "required", schPath, "", requiredMsg("2"), {
          missingProperty: "2",
        })
        shouldBeError(fullValidate.errors?.[1], "required", schPath, "", requiredMsg("98"), {
          missingProperty: "98",
        })
      }
    }

    it('with "properties"', () => {
      testRequiredAndProperties()
    })

    function testRequiredAndProperties() {
      const schema = {
        properties: {
          foo: {type: "number"},
          bar: {type: "number"},
          baz: {type: "number"},
        },
        required: ["foo", "bar", "baz"],
      }

      _testRequired(schema)
    }

    it('in "anyOf"', () => {
      testRequiredInAnyOf()
    })

    function testRequiredInAnyOf() {
      const schema = {
        anyOf: [{required: ["foo", "bar", "baz"]}],
      }

      _testRequired(schema, "#/anyOf/0", 1)
    }

    it("should not validate required twice in large schemas with loopRequired option", () => {
      ajv = new _Ajv({loopRequired: 1, allErrors: true})

      const schema = {
        type: "object",
        properties: {
          foo: {type: "integer"},
          bar: {type: "integer"},
        },
        required: ["foo", "bar"],
      }

      const validate = ajv.compile(schema)

      validate({}).should.equal(false)
      validate.errors?.should.have.length(2)
    })

    it("should not validate required twice with $data ref", () => {
      ajv = new _Ajv({$data: true, allErrors: true})

      const schema = {
        type: "object",
        properties: {
          foo: {type: "integer"},
          bar: {type: "integer"},
        },
        required: {$data: "0/requiredProperties"},
      }

      const validate = ajv.compile(schema)

      validate({requiredProperties: ["foo", "bar"]}).should.equal(false)
      validate.errors?.should.have.length(2)
    })

    it("should show different error when required is $data of incorrect type", () => {
      test(new _Ajv({$data: true}))
      test(new _Ajv({$data: true, allErrors: true}))

      function test(_ajv) {
        const schema = {
          type: "object",
          required: {$data: "0/req"},
          properties: {
            req: {},
            foo: {},
            bar: {},
          },
        }

        const validate = _ajv.compile(schema)

        shouldBeValid(validate, {req: ["foo", "bar"], foo: 1, bar: 2})
        shouldBeInvalid(validate, {req: ["foo", "bar"], foo: 1})
        shouldBeError(
          validate.errors?.[0],
          "required",
          "#/required",
          "",
          "should have required property 'bar'",
          {missingProperty: "bar"}
        )

        shouldBeInvalid(validate, {req: "invalid"})
        shouldBeError(
          validate.errors?.[0],
          "required",
          "#/required",
          "",
          '"required" keyword must be array ($data)',
          {}
        )
      }
    })
  })

  describe('"dependencies" errors', () => {
    it("should NOT include missing property in dataPath", () => {
      testDependencies()
    })

    function testDependencies() {
      const schema = {
        dependencies: {
          a: ["foo", "bar", "baz"],
        },
      }

      const data = {a: 0, foo: 1, bar: 2, baz: 3},
        invalidData1 = {a: 0, foo: 1, baz: 3},
        invalidData2 = {a: 0, bar: 2}

      const msg = "should have properties foo, bar, baz when property a is present"

      const validate = ajv.compile(schema)
      shouldBeValid(validate, data)
      shouldBeInvalid(validate, invalidData1)
      shouldBeError(validate.errors?.[0], "dependencies", "#/dependencies", "", msg, params("bar"))
      shouldBeInvalid(validate, invalidData2)
      shouldBeError(validate.errors?.[0], "dependencies", "#/dependencies", "", msg, params("foo"))

      const validateJP = ajvJP.compile(schema)
      shouldBeValid(validateJP, data)
      shouldBeInvalid(validateJP, invalidData1)
      shouldBeError(
        validateJP.errors?.[0],
        "dependencies",
        "#/dependencies",
        "",
        msg,
        params("bar")
      )
      shouldBeInvalid(validateJP, invalidData2)
      shouldBeError(
        validateJP.errors?.[0],
        "dependencies",
        "#/dependencies",
        "",
        msg,
        params("foo")
      )

      const fullValidate = fullAjv.compile(schema)
      shouldBeValid(fullValidate, data)
      shouldBeInvalid(fullValidate, invalidData1)
      shouldBeError(
        fullValidate.errors?.[0],
        "dependencies",
        "#/dependencies",
        "",
        msg,
        params("bar")
      )
      shouldBeInvalid(fullValidate, invalidData2, 2)
      shouldBeError(
        fullValidate.errors?.[0],
        "dependencies",
        "#/dependencies",
        "",
        msg,
        params("foo")
      )
      shouldBeError(
        fullValidate.errors?.[1],
        "dependencies",
        "#/dependencies",
        "",
        msg,
        params("baz")
      )

      function params(missing) {
        const p = {
          property: "a",
          deps: "foo, bar, baz",
          depsCount: 3,
          missingProperty: missing,
        }
        return p
      }
    }
  })

  function _testRequired(schema, schemaPathPrefix = "#", extraErrors = 0) {
    const schPath = schemaPathPrefix + "/required"

    const data = {foo: 1, bar: 2, baz: 3},
      invalidData1 = {foo: 1, baz: 3},
      invalidData2 = {bar: 2}

    const validate = ajv.compile(schema)
    shouldBeValid(validate, data)
    shouldBeInvalid(validate, invalidData1, 1 + extraErrors)
    shouldBeError(validate.errors?.[0], "required", schPath, "", requiredMsg("bar"), {
      missingProperty: "bar",
    })
    shouldBeInvalid(validate, invalidData2, 1 + extraErrors)
    shouldBeError(validate.errors?.[0], "required", schPath, "", requiredMsg("foo"), {
      missingProperty: "foo",
    })

    const validateJP = ajvJP.compile(schema)
    shouldBeValid(validateJP, data)
    shouldBeInvalid(validateJP, invalidData1, 1 + extraErrors)
    shouldBeError(validateJP.errors?.[0], "required", schPath, "", requiredMsg("bar"), {
      missingProperty: "bar",
    })
    shouldBeInvalid(validateJP, invalidData2, 1 + extraErrors)
    shouldBeError(validateJP.errors?.[0], "required", schPath, "", requiredMsg("foo"), {
      missingProperty: "foo",
    })

    const fullValidate = fullAjv.compile(schema)
    shouldBeValid(fullValidate, data)
    shouldBeInvalid(fullValidate, invalidData1, 1 + extraErrors)
    shouldBeError(fullValidate.errors?.[0], "required", schPath, "", requiredMsg("bar"), {
      missingProperty: "bar",
    })
    shouldBeInvalid(fullValidate, invalidData2, 2 + extraErrors)
    shouldBeError(fullValidate.errors?.[0], "required", schPath, "", requiredMsg("foo"), {
      missingProperty: "foo",
    })
    shouldBeError(fullValidate.errors?.[1], "required", schPath, "", requiredMsg("baz"), {
      missingProperty: "baz",
    })
  }

  function requiredMsg(prop: string) {
    return `should have required property '${prop}'`
  }

  it('"items" errors should include item index without quotes in dataPath (#48)', () => {
    const schema1 = {
      $id: "schema1",
      type: "array",
      items: {
        type: "integer",
        minimum: 10,
      },
    }

    const data = [10, 11, 12],
      invalidData1 = [1, 10],
      invalidData2 = [10, 9, 11, 8, 12]

    let validate = ajv.compile(schema1)
    shouldBeValid(validate, data)
    shouldBeInvalid(validate, invalidData1)
    shouldBeError(validate.errors?.[0], "minimum", "#/items/minimum", "/0", "should be >= 10")
    shouldBeInvalid(validate, invalidData2)
    shouldBeError(validate.errors?.[0], "minimum", "#/items/minimum", "/1", "should be >= 10")

    const validateJP = ajvJP.compile(schema1)
    shouldBeValid(validateJP, data)
    shouldBeInvalid(validateJP, invalidData1)
    shouldBeError(validateJP.errors?.[0], "minimum", "#/items/minimum", "/0", "should be >= 10")
    shouldBeInvalid(validateJP, invalidData2)
    shouldBeError(validateJP.errors?.[0], "minimum", "#/items/minimum", "/1", "should be >= 10")

    const fullValidate = fullAjv.compile(schema1)
    shouldBeValid(fullValidate, data)
    shouldBeInvalid(fullValidate, invalidData1)
    shouldBeError(fullValidate.errors?.[0], "minimum", "#/items/minimum", "[0]", "should be >= 10")
    shouldBeInvalid(fullValidate, invalidData2, 2)
    shouldBeError(fullValidate.errors?.[0], "minimum", "#/items/minimum", "[1]", "should be >= 10")
    shouldBeError(fullValidate.errors?.[1], "minimum", "#/items/minimum", "[3]", "should be >= 10")

    const schema2 = {
      $id: "schema2",
      type: "array",
      items: [{minimum: 10}, {minimum: 9}, {minimum: 12}],
    }

    validate = ajv.compile(schema2)
    shouldBeValid(validate, data)
    shouldBeInvalid(validate, invalidData1)
    shouldBeError(validate.errors?.[0], "minimum", "#/items/0/minimum", "/0", "should be >= 10")
    shouldBeInvalid(validate, invalidData2)
    shouldBeError(validate.errors?.[0], "minimum", "#/items/2/minimum", "/2", "should be >= 12")
  })

  it("should have correct schema path for additionalItems", () => {
    const schema = {
      type: "array",
      items: [{type: "integer"}, {type: "integer"}],
      minItems: 2,
      additionalItems: false,
    }

    const data = [1, 2]
    const invalidData = [1, 2, 3]

    test(ajv)
    test(ajvJP)
    test(fullAjv)

    function test(_ajv) {
      const validate = _ajv.compile(schema)
      shouldBeValid(validate, data)
      shouldBeInvalid(validate, invalidData)
      shouldBeError(
        validate.errors?.[0],
        "additionalItems",
        "#/additionalItems",
        "",
        "should NOT have more than 2 items"
      )
    }
  })

  describe('"propertyNames" errors', () => {
    it("should add propertyName to errors", () => {
      const schema = {
        type: "object",
        propertyNames: {pattern: "bar"},
      }

      const data = {
        bar: {},
        "bar.baz@email.example.com": {},
      }

      const invalidData = {
        bar: {},
        "bar.baz@email.example.com": {},
        foo: {},
        quux: {},
      }

      test(ajv, 2)
      test(ajvJP, 2)
      test(fullAjv, 4)

      function test(_ajv: Ajv, numErrors: number) {
        const validate = _ajv.compile(schema)
        shouldBeValid(validate, data)
        shouldBeInvalid(validate, invalidData, numErrors)
        shouldBeError(
          validate.errors?.[0],
          "pattern",
          "#/propertyNames/pattern",
          "",
          'should match pattern "bar"'
        )
        shouldBeError(
          validate.errors?.[1],
          "propertyNames",
          "#/propertyNames",
          "",
          "property name 'foo' is invalid"
        )
        if (numErrors === 4) {
          shouldBeError(
            validate.errors?.[2],
            "pattern",
            "#/propertyNames/pattern",
            "",
            'should match pattern "bar"'
          )
          shouldBeError(
            validate.errors?.[3],
            "propertyNames",
            "#/propertyNames",
            "",
            "property name 'quux' is invalid"
          )
        }
      }
    })
  })

  describe("oneOf errors", () => {
    it("should have errors from inner schemas", () => {
      const schema = {
        oneOf: [{type: "number"}, {type: "integer"}],
      }

      test(ajv)
      test(fullAjv)

      function test(_ajv) {
        const validate = _ajv.compile(schema)
        validate("foo").should.equal(false)
        validate.errors.length.should.equal(3)
        validate(1).should.equal(false)
        validate.errors.length.should.equal(1)
        validate(1.5).should.equal(true)
      }
    })

    it("should return passing schemas in error params", () => {
      const schema = {
        oneOf: [{type: "number"}, {type: "integer"}, {const: 1.5}],
      }

      test(ajv)
      test(fullAjv)

      function test(_ajv) {
        const validate = _ajv.compile(schema)
        validate(1).should.equal(false)
        let err = validate.errors.pop()
        err.keyword.should.equal("oneOf")
        err.params.should.eql({passingSchemas: [0, 1]})

        validate(1.5).should.equal(false)
        err = validate.errors.pop()
        err.keyword.should.equal("oneOf")
        err.params.should.eql({passingSchemas: [0, 2]})

        validate(2.5).should.equal(true)

        validate("foo").should.equal(false)
        err = validate.errors.pop()
        err.keyword.should.equal("oneOf")
        err.params.should.eql({passingSchemas: null})
      }
    })
  })

  describe("anyOf errors", () => {
    it("should have errors from inner schemas", () => {
      const schema = {
        anyOf: [{type: "number"}, {type: "integer"}],
      }

      test(ajv)
      test(fullAjv)

      function test(_ajv) {
        const validate = _ajv.compile(schema)
        validate("foo").should.equal(false)
        validate.errors.length.should.equal(3)
        validate(1).should.equal(true)
        validate(1.5).should.equal(true)
      }
    })
  })

  describe("type errors", () => {
    describe("integer", () => {
      it("should have only one error in {allErrors: false} mode", () => {
        test(ajv)
      })

      it("should return all errors in {allErrors: true} mode", () => {
        test(fullAjv, 2)
      })

      function test(_ajv, numErrors?: number) {
        const schema = {
          type: "integer",
          minimum: 5,
        }

        const validate = _ajv.compile(schema)
        shouldBeValid(validate, 5)
        shouldBeInvalid(validate, 5.5)
        shouldBeInvalid(validate, 4)
        shouldBeInvalid(validate, "4")
        shouldBeInvalid(validate, 4.5, numErrors)
      }
    })

    describe("keyword for another type", () => {
      it("should have only one error in {allErrors: false} mode", () => {
        test(ajv)
      })

      it("should return all errors in {allErrors: true} mode", () => {
        test(fullAjv, 2)
      })

      function test(_ajv, numErrors?: number) {
        const schema = {
          type: "array",
          minItems: 2,
          minimum: 5,
        }

        const validate = _ajv.compile(schema)
        shouldBeValid(validate, [1, 2])
        shouldBeInvalid(validate, [1])
        shouldBeInvalid(validate, 5)
        shouldBeInvalid(validate, 4, numErrors)
      }
    })

    describe("array of types", () => {
      it("should have only one error in {allErrors: false} mode", () => {
        test(ajv)
      })

      it("should return all errors in {allErrors: true} mode", () => {
        test(fullAjv, 2)
      })

      function test(_ajv: Ajv, numErrors?: number) {
        const schema = {
          type: ["array", "object"],
          minItems: 2,
          minProperties: 2,
          minimum: 5, // this keyword would log/throw in strictTypes mode
        }

        const validate = _ajv.compile(schema)
        shouldBeValid(validate, [1, 2])
        shouldBeValid(validate, {foo: 1, bar: 2})
        shouldBeInvalid(validate, [1])
        shouldBeInvalid(validate, {foo: 1})
        shouldBeInvalid(validate, 5) // fails because number not allowed
        shouldBeInvalid(validate, 4, numErrors)
      }
    })
  })

  describe("exclusiveMaximum/Minimum errors", () => {
    it("should include limits in error message", () => {
      const schema = {
        type: "integer",
        exclusiveMinimum: 2,
        exclusiveMaximum: 5,
      }

      ;[ajv, fullAjv].forEach((_ajv) => {
        const validate = _ajv.compile(schema)
        shouldBeValid(validate, 3)
        shouldBeValid(validate, 4)

        shouldBeInvalid(validate, 2)
        testError("exclusiveMinimum", "should be > 2", {
          comparison: ">",
          limit: 2,
        })

        shouldBeInvalid(validate, 5)
        testError("exclusiveMaximum", "should be < 5", {
          comparison: "<",
          limit: 5,
        })

        function testError(keyword, message, params) {
          const err = validate.errors?.[0]
          shouldBeError(err, keyword, "#/" + keyword, "", message, params)
        }
      })
    })

    it("should include limits in error message with $data", () => {
      const schema = {
        type: "object",
        properties: {
          smaller: {
            type: "number",
            exclusiveMaximum: {$data: "1/larger"},
          },
          larger: {type: "number"},
        },
      }

      ajv = new _Ajv({$data: true})
      fullAjv = new _Ajv({
        $data: true,
        allErrors: true,
        verbose: true,
        jsPropertySyntax: true, // deprecated
        logger: false,
      })
      ;[ajv, fullAjv].forEach((_ajv) => {
        const validate = _ajv.compile(schema)
        shouldBeValid(validate, {smaller: 2, larger: 4})
        shouldBeValid(validate, {smaller: 3, larger: 4})

        shouldBeInvalid(validate, {smaller: 4, larger: 4})
        testError()

        shouldBeInvalid(validate, {smaller: 5, larger: 4})
        testError()

        function testError() {
          const err = validate.errors?.[0]
          shouldBeError(
            err,
            "exclusiveMaximum",
            "#/properties/smaller/exclusiveMaximum",
            _ajv.opts.jsPropertySyntax ? ".smaller" : "/smaller",
            "should be < 4",
            {comparison: "<", limit: 4}
          )
        }
      })
    })
  })

  describe("if/then/else errors", () => {
    let validate: ValidateFunction, numErrors

    it("if/then/else should include failing keyword in message and params", () => {
      const schema = {
        type: "number",
        if: {maximum: 10},
        then: {multipleOf: 2},
        else: {multipleOf: 5},
      }

      ;[ajv, fullAjv].forEach((_ajv) => {
        prepareTest(_ajv, schema)
        shouldBeValid(validate, 8)
        shouldBeValid(validate, 15)

        shouldBeInvalid(validate, 7, numErrors)
        testIfError("then", 2)

        shouldBeInvalid(validate, 17, numErrors)
        testIfError("else", 5)
      })
    })

    it("if/then should include failing keyword in message and params", () => {
      const schema = {
        type: "number",
        if: {maximum: 10},
        then: {multipleOf: 2},
      }

      ;[ajv, fullAjv].forEach((_ajv) => {
        prepareTest(_ajv, schema)
        shouldBeValid(validate, 8)
        shouldBeValid(validate, 11)
        shouldBeValid(validate, 12)

        shouldBeInvalid(validate, 7, numErrors)
        testIfError("then", 2)
      })
    })

    it("if/else should include failing keyword in message and params", () => {
      const schema = {
        type: "number",
        if: {maximum: 10},
        else: {multipleOf: 5},
      }

      ;[ajv, fullAjv].forEach((_ajv) => {
        prepareTest(_ajv, schema)
        shouldBeValid(validate, 7)
        shouldBeValid(validate, 8)
        shouldBeValid(validate, 15)

        shouldBeInvalid(validate, 17, numErrors)
        testIfError("else", 5)
      })
    })

    function prepareTest(_ajv: Ajv, schema) {
      validate = _ajv.compile(schema)
      numErrors = _ajv.opts.allErrors ? 2 : 1
    }

    function testIfError(ifClause, multipleOf) {
      let err = validate.errors?.[0]
      shouldBeError(
        err,
        "multipleOf",
        "#/" + ifClause + "/multipleOf",
        "",
        "should be multiple of " + multipleOf,
        {multipleOf: multipleOf}
      )

      if (numErrors === 2) {
        err = validate.errors?.[1]
        shouldBeError(err, "if", "#/if", "", 'should match "' + ifClause + '" schema', {
          failingKeyword: ifClause,
        })
      }
    }
  })

  describe("uniqueItems errors", () => {
    it("should not return uniqueItems error when non-unique items are of a different type than required", () => {
      const schema = {
        type: "array",
        items: {type: "number"},
        uniqueItems: true,
      }

      ;[ajvJP, fullAjv].forEach((_ajv) => {
        const validate = _ajv.compile(schema)
        shouldBeValid(validate, [1, 2, 3])

        shouldBeInvalid(validate, [1, 2, 2])
        shouldBeError(
          validate.errors?.[0],
          "uniqueItems",
          "#/uniqueItems",
          "",
          "should NOT have duplicate items (items ## 2 and 1 are identical)",
          {i: 1, j: 2}
        )

        const expectedErrors = _ajv.opts.allErrors ? 2 : 1
        shouldBeInvalid(validate, [1, "2", "2", 2], expectedErrors)
        testTypeError(0, _ajv.opts.jsPropertySyntax ? "[1]" : "/1")
        if (expectedErrors === 2) testTypeError(1, _ajv.opts.jsPropertySyntax ? "[2]" : "/2")

        function testTypeError(i, dataPath) {
          const err = validate.errors?.[i]
          shouldBeError(err, "type", "#/items/type", dataPath, "should be number")
        }
      })
    })
  })

  function testSchema1(schema, schemaPathPrefix = "#/properties/foo") {
    _testSchema1(ajv, schema, schemaPathPrefix)
    _testSchema1(ajvJP, schema, schemaPathPrefix)
    _testSchema1(fullAjv, schema, schemaPathPrefix)
  }

  function _testSchema1(_ajv, schema, schemaPathPrefix) {
    const schPath = schemaPathPrefix + "/type"

    const data = {foo: 1},
      invalidData = {foo: "bar"}

    const validate = _ajv.compile(schema)
    shouldBeValid(validate, data)
    shouldBeInvalid(validate, invalidData)
    shouldBeError(
      validate.errors?.[0],
      "type",
      schPath,
      _ajv.opts.jsPropertySyntax ? ".foo" : "/foo"
    )
  }

  function shouldBeValid(validate, data) {
    validate(data).should.equal(true)
    should.equal(validate.errors, null)
  }

  function shouldBeInvalid(validate, data, numErrors = 1) {
    validate(data).should.equal(false)
    should.equal(validate.errors.length, numErrors)
  }

  function shouldBeError(
    error,
    keyword,
    schemaPath,
    dataPath,
    message?: string,
    params?: Record<string, any>
  ) {
    error.keyword.should.equal(keyword)
    error.schemaPath.should.equal(schemaPath)
    error.dataPath.should.equal(dataPath)
    error.message.should.be.a("string")
    if (message !== undefined) error.message.should.equal(message)
    if (params !== undefined) error.params.should.eql(params)
  }
})
