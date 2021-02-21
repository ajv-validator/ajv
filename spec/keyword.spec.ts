import type {ErrorObject, SchemaObject, SchemaValidateFunction} from "../lib/types"
import type AjvCore from "../dist/core"
// currently most tests include compiled code, if any code re-compiled locally, instanceof would fail
import {_, nil} from "../dist/compile/codegen/code"
import getAjvAllInstances from "./ajv_all_instances"
import _Ajv from "./ajv"
import assert = require("assert")

import chai from "./chai"
const should = chai.should(),
  equal = require("../dist/compile/equal")

describe("User-defined keywords", () => {
  let ajv: AjvCore, instances: AjvCore[]

  beforeEach(() => {
    instances = getAjvAllInstances(
      {
        allErrors: true,
        verbose: true,
        inlineRefs: false,
      },
      {allowUnionTypes: true}
    )
    ajv = instances[0]
  })

  describe("user-defined keyword", () => {
    describe('keyword with "validate" function', () => {
      it("should add and validate keyword", () => {
        testEvenKeyword({keyword: "x-even", type: "number", validate: validateEven})

        function validateEven(schema, data) {
          if (typeof schema != "boolean") {
            throw new Error('The value of "even" keyword must be boolean')
          }
          return data % 2 ? !schema : schema
        }
      })

      it("should add, validate keyword schema and validate rule", () => {
        testEvenKeyword({
          keyword: "x-even",
          type: "number",
          validate: validateEven,
          metaSchema: {type: "boolean"},
        })

        shouldBeInvalidSchema({type: "number", "x-even": "not_boolean"})

        function validateEven(schema, data) {
          return data % 2 ? !schema : schema
        }
      })

      it('should pass parent schema to "interpreted" keyword validation', () => {
        testRangeKeyword({
          keyword: "x-range",
          type: "number",
          validate: validateRange,
        })

        function validateRange(schema, data, parentSchema) {
          validateRangeSchema(schema, parentSchema)

          return parentSchema.exclusiveRange === true
            ? data > schema[0] && data < schema[1]
            : data >= schema[0] && data <= schema[1]
        }
      })

      it('should validate meta schema and pass parent schema to "interpreted" keyword validation', () => {
        testRangeKeyword({
          keyword: "x-range",
          type: "number",
          validate: validateRange,
          metaSchema: {
            type: "array",
            items: [{type: "number"}, {type: "number"}],
            minItems: 2,
            additionalItems: false,
          },
        })
        shouldBeInvalidSchema({type: "number", "x-range": ["1", 2]})
        shouldBeInvalidSchema({type: "number", "x-range": {}})
        shouldBeInvalidSchema({type: "number", "x-range": [1, 2, 3]})

        function validateRange(schema, data, parentSchema) {
          return parentSchema.exclusiveRange === true
            ? data > schema[0] && data < schema[1]
            : data >= schema[0] && data <= schema[1]
        }
      })

      it('should allow defining errors for "validate" keyword', () => {
        const validateRange: SchemaValidateFunction = _validateRange
        testRangeKeyword({keyword: "x-range", type: "number", validate: validateRange}, true)

        function _validateRange(schema, data, parentSchema) {
          validateRangeSchema(schema, parentSchema)
          const min = schema[0],
            max = schema[1],
            exclusive = parentSchema.exclusiveRange === true

          const minOk = exclusive ? data > min : data >= min
          const maxOk = exclusive ? data < max : data <= max
          const valid = minOk && maxOk

          if (!valid) {
            const err: Partial<ErrorObject> = {keyword: "x-range"}
            validateRange.errors = [err]
            let comparison, limit
            if (minOk) {
              comparison = exclusive ? "<" : "<="
              limit = max
            } else {
              comparison = exclusive ? ">" : ">="
              limit = min
            }
            err.message = "should be " + comparison + " " + limit
            err.params = {
              comparison: comparison,
              limit: limit,
              exclusive: exclusive,
            }
          }

          return valid
        }
      })

      it("should support schemaType", () => {
        testEvenKeyword({
          keyword: "x-even",
          type: "number",
          schemaType: "boolean",
          validate: (schema, data) => (data % 2 ? !schema : schema),
        })
      })
    })

    describe('keyword with "compile" function', () => {
      it("should add and validate keyword", () => {
        testEvenKeyword({
          keyword: "x-even",
          type: "number",
          compile: compileEven,
        })
        shouldBeInvalidSchema(
          {
            type: "number",
            "x-even": "not_boolean",
          },
          'The value of "x-even" keyword must be boolean'
        )

        function compileEven(schema) {
          if (typeof schema != "boolean") {
            throw new Error('The value of "x-even" keyword must be boolean')
          }
          return schema ? isEven : isOdd
        }

        function isEven(data) {
          return data % 2 === 0
        }
        function isOdd(data) {
          return data % 2 !== 0
        }
      })

      it("should add, validate keyword schema and validate rule", () => {
        testEvenKeyword({
          keyword: "x-even",
          type: "number",
          compile: compileEven,
          metaSchema: {type: "boolean"},
        })
        shouldBeInvalidSchema({
          type: "number",
          "x-even": "not_boolean",
        })

        function compileEven(schema) {
          return schema ? isEven : isOdd
        }

        function isEven(data) {
          return data % 2 === 0
        }
        function isOdd(data) {
          return data % 2 !== 0
        }
      })

      it("should compile keyword validating function only once per schema", () => {
        testConstantKeyword({keyword: "myConstant", compile: compileConstant})
      })

      it("should allow multiple schemas for the same keyword", () => {
        testMultipleConstantKeyword({keyword: "x-constant", compile: compileConstant})
      })

      it('should pass parent schema to "compiled" keyword validation', () => {
        testRangeKeyword({keyword: "x-range", type: "number", compile: compileRange})
      })

      it("should allow multiple parent schemas for the same keyword", () => {
        testMultipleRangeKeyword({keyword: "x-range", type: "number", compile: compileRange})
      })

      it("should support schemaType", () => {
        testEvenKeyword({
          keyword: "x-even",
          type: "number",
          schemaType: "boolean",
          compile: compileEven,
        })
        shouldBeInvalidSchema(
          {
            type: "number",
            "x-even": "not_boolean",
          },
          'x-even value must be ["boolean"]'
        )

        function compileEven(schema) {
          if (schema) return (data) => data % 2 === 0
          return (data) => data % 2 !== 0
        }
      })
    })

    function compileConstant(schema) {
      return typeof schema == "object" && schema !== null ? isDeepEqual : isStrictEqual

      function isDeepEqual(data) {
        return equal(data, schema)
      }
      function isStrictEqual(data) {
        return data === schema
      }
    }

    function compileRange(schema, parentSchema) {
      validateRangeSchema(schema, parentSchema)

      const min = schema[0]
      const max = schema[1]

      return parentSchema.exclusiveRange === true
        ? (data) => data > min && data < max
        : (data) => data >= min && data <= max
    }
  })

  describe("macro keywords", () => {
    it('should add and validate keywords with "macro" function', () => {
      testEvenKeyword({keyword: "x-even", type: "number", macro: macroEven}, 2)
    })

    it("should add and expand macro rule", () => {
      testConstantKeyword({keyword: "myConstant", macro: macroConstant}, 2)
    })

    it("should allow multiple schemas for the same macro keyword", () => {
      testMultipleConstantKeyword({keyword: "x-constant", macro: macroConstant}, 2)
    })

    it('should pass parent schema to "macro" keyword', () => {
      testRangeKeyword({keyword: "x-range", type: "number", macro: macroRange}, undefined, 2)
    })

    it("should allow multiple parent schemas for the same macro keyword", () => {
      testMultipleRangeKeyword({keyword: "x-range", type: "number", macro: macroRange}, 2)
    })

    it("should support resolving $ref without id or $id", () => {
      instances.forEach((_ajv) => {
        _ajv.addKeyword({
          keyword: "macroRef",
          macro(schema, _parentSchema, it) {
            it.baseId.should.equal("#")
            const ref = schema.$ref
            const validate = _ajv.getSchema(ref)
            if (!validate) throw new _Ajv.MissingRefError(it.baseId, ref)
            return validate.schema
          },
          metaSchema: {
            type: "object",
            required: ["$ref"],
            additionalProperties: false,
            properties: {
              $ref: {
                type: "string",
              },
            },
          },
        })
        const schema = {
          macroRef: {
            $ref: "#/definitions/schema",
          },
          definitions: {
            schema: {
              type: "string",
            },
          },
        }
        const validate = _ajv.compile(schema)
        shouldBeValid(validate, "foo")
        shouldBeInvalid(validate, 1, 2)
      })
    })

    it("should recursively expand macro keywords", () => {
      instances.forEach((_ajv) => {
        _ajv.addKeyword({
          keyword: "deepProperties",
          type: "object",
          macro: macroDeepProperties,
        })
        _ajv.addKeyword({keyword: "range", type: "number", macro: macroRange})

        const schema = {
          type: "object",
          deepProperties: {
            "a.b.c": {type: "number", range: [2, 4]},
            "d.e.f.g": {type: "string"},
          },
        }

        /* This schema recursively expands to:
        {
          "allOf": [
            {
              "properties": {
                "a": {
                  "properties": {
                    "b": {
                      "properties": {
                        "c": {
                          "type": "number",
                          "minimum": 2,
                          "exclusiveMinimum": false,
                          "maximum": 4,
                          "exclusiveMaximum": false
                        }
                      }
                    }
                  }
                }
              }
            },
            {
              "properties": {
                "d": {
                  "properties": {
                    "e": {
                      "properties": {
                        "f": {
                          "properties": {
                            "g": {
                              "type": "string"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        }
        */

        const validate = _ajv.compile(schema)

        shouldBeValid(validate, {
          a: {b: {c: 3}},
          d: {e: {f: {g: "foo"}}},
        })

        shouldBeInvalid(
          validate,
          {
            a: {b: {c: 5}}, // out of range
            d: {e: {f: {g: "foo"}}},
          },
          5
        )

        shouldBeInvalid(
          validate,
          {
            a: {b: {c: "bar"}}, // not number
            d: {e: {f: {g: "foo"}}},
          },
          4
        )

        shouldBeInvalid(
          validate,
          {
            a: {b: {c: 3}},
            d: {e: {f: {g: 2}}}, // not string
          },
          5
        )

        function macroDeepProperties(_schema) {
          if (typeof _schema != "object") {
            throw new Error("schema of deepProperty should be an object")
          }

          const expanded: any[] = []

          for (const prop in _schema) {
            const path = prop.split(".")
            const properties = {}
            if (path.length === 1) {
              properties[prop] = _schema[prop]
            } else {
              const deepProperties = {}
              deepProperties[path.slice(1).join(".")] = _schema[prop]
              properties[path[0]] = {type: "object", deepProperties}
            }
            expanded.push({type: "object", properties})
          }

          return expanded.length === 1 ? expanded[0] : {allOf: expanded}
        }
      })
    })

    it("should correctly expand multiple macros on the same level", () => {
      instances.forEach((_ajv) => {
        _ajv.addKeyword({keyword: "range", type: "number", macro: macroRange})
        _ajv.addKeyword({keyword: "even", type: "number", macro: macroEven})

        const schema = {
          type: "number",
          range: [4, 6],
          even: true,
        }

        const validate = _ajv.compile(schema)
        const numErrors = _ajv.opts.allErrors ? 4 : 2

        shouldBeInvalid(validate, 2, 2)
        shouldBeInvalid(validate, 3, numErrors)
        shouldBeValid(validate, 4)
        shouldBeInvalid(validate, 5, 2)
        shouldBeValid(validate, 6)
        shouldBeInvalid(validate, 7, numErrors)
        shouldBeInvalid(validate, 8, 2)
      })
    })

    it("should validate macro keyword when it resolves to the same keyword as exists", () => {
      instances.forEach((_ajv) => {
        _ajv.addKeyword({keyword: "range", type: "number", macro: macroRange})

        const schema = {
          type: "number",
          range: [1, 4],
          minimum: 2.5,
        }

        const validate = _ajv.compile(schema)

        shouldBeValid(validate, 3)
        shouldBeInvalid(validate, 2)
      })
    })

    it("should correctly expand macros in subschemas", () => {
      instances.forEach((_ajv) => {
        _ajv.addKeyword({keyword: "range", type: "number", macro: macroRange})

        const schema = {
          type: "number",
          allOf: [{range: [4, 8]}, {range: [2, 6]}],
        }

        const validate = _ajv.compile(schema)

        shouldBeInvalid(validate, 2, 2)
        shouldBeInvalid(validate, 3, 2)
        shouldBeValid(validate, 4)
        shouldBeValid(validate, 5)
        shouldBeValid(validate, 6)
        shouldBeInvalid(validate, 7, 2)
        shouldBeInvalid(validate, 8, 2)
      })
    })

    it("should correctly expand macros in macro expansions", () => {
      instances.forEach((_ajv) => {
        _ajv.addKeyword({keyword: "range", type: "number", macro: macroRange})
        _ajv.addKeyword({keyword: "exclusiveRange", metaSchema: {type: "boolean"}})
        _ajv.addKeyword({keyword: "myContains", type: "array", macro: macroContains})

        const schema = {
          type: "array",
          myContains: {
            type: "number",
            range: [4, 7],
            exclusiveRange: true,
          },
        }

        const validate = _ajv.compile(schema)

        shouldBeInvalid(validate, [1, 2, 3], 2)
        shouldBeInvalid(validate, [2, 3, 4], 2)
        shouldBeValid(validate, [3, 4, 5]) // only 5 is in range
        shouldBeValid(validate, [6, 7, 8]) // only 6 is in range
        shouldBeInvalid(validate, [7, 8, 9], 2)
        shouldBeInvalid(validate, [8, 9, 10], 2)

        function macroContains(_schema) {
          return {not: {items: {not: _schema}}}
        }
      })
    })

    it("should throw exception if macro expansion is an invalid schema", () => {
      ajv.addKeyword({keyword: "invalid", macro: macroInvalid})
      const schema = {invalid: true}

      should.throw(() => {
        ajv.compile(schema)
      }, /type should be equal to one of the allowed values/)

      function macroInvalid(/* schema */) {
        return {type: "invalid"}
      }
    })

    function macroEven(schema) {
      if (schema === true) return {multipleOf: 2}
      if (schema === false) return {not: {multipleOf: 2}}
      throw new Error('Schema for "even" keyword should be boolean')
    }

    function macroConstant(schema /*, parentSchema */) {
      return {enum: [schema]}
    }

    function macroRange(schema, parentSchema) {
      validateRangeSchema(schema, parentSchema)
      const exclusive = !!parentSchema.exclusiveRange

      return exclusive
        ? {exclusiveMinimum: schema[0], exclusiveMaximum: schema[1]}
        : {minimum: schema[0], maximum: schema[1]}
    }
  })

  describe('"code" keywords', () => {
    it('should add and validate keyword with "code" function', () => {
      testEvenKeyword({
        keyword: "x-even",
        type: "number",
        code(cxt) {
          const {schema, data} = cxt
          const op = schema ? _`===` : _`!==`
          cxt.pass(_`${data} % 2 ${op} 0`)
        },
      })
    })

    it('should pass parent schema to "inline" keyword', () => {
      testRangeKeyword({
        keyword: "x-range",
        type: "number",
        code(cxt) {
          const {
            schema: [min, max],
            parentSchema,
            data,
          } = cxt
          const eq = parentSchema.exclusiveRange ? nil : _`=`
          cxt.pass(_`${data} >${eq} ${min} && ${data} <${eq} ${max}`)
        },
      })
    })

    it("should allow defining keyword error", () => {
      testRangeKeyword({
        keyword: "x-range",
        type: "number",
        code(cxt) {
          const {
            gen,
            schema: [min, max],
            parentSchema,
            data,
          } = cxt
          const eq = parentSchema.exclusiveRange ? nil : _`=`
          const minOk = gen.const("minOk", _`${data} >${eq} ${min}`)
          const maxOk = gen.const("maxOk", _`${data} <${eq} ${max}`)
          cxt.setParams({minOk, maxOk, eq})
          cxt.pass(_`${minOk} && ${maxOk}`)
        },
        error: {
          message: ({params: {minOk, eq}, schema: [min, max]}) =>
            _`${minOk} ? "should be <${eq} ${max}" : "should be >${eq} ${min}"`,
          params: ({params: {minOk, eq}, schema: [min, max], parentSchema}) => _`{
            comparison: ${minOk} ? "<${eq}" : ">${eq}",
            limit: ${minOk} ? ${max} : ${min},
            exclusive: ${!!parentSchema.exclusiveRange}
          }`,
        },
      })
    })
  })

  describe('$data reference support with "validate" keywords (with $data option)', () => {
    beforeEach(() => {
      instances = getAjvAllInstances(
        {
          allErrors: true,
          verbose: true,
          inlineRefs: false,
        },
        {$data: true, allowUnionTypes: true}
      )
      ajv = instances[0]
    })

    it('should validate "interpreted" rule', () => {
      testEvenKeyword$data({
        keyword: "x-even-$data",
        type: "number",
        $data: true,
        validate: validateEven,
      })

      function validateEven(schema, data) {
        if (typeof schema != "boolean") return false
        return data % 2 ? !schema : schema
      }
    })

    it('should validate rule with "compile" and "validate" funcs', () => {
      let compileCalled
      testEvenKeyword$data({
        keyword: "x-even-$data",
        type: "number",
        $data: true,
        compile: compileEven,
        validate: validateEven,
      })
      compileCalled.should.equal(true)

      function validateEven(schema, data) {
        if (typeof schema != "boolean") return false
        return data % 2 ? !schema : schema
      }

      function compileEven(schema) {
        compileCalled = true
        if (typeof schema != "boolean") {
          throw new Error('The value of "even" keyword must be boolean')
        }
        return schema ? isEven : isOdd
      }

      function isEven(data) {
        return data % 2 === 0
      }
      function isOdd(data) {
        return data % 2 !== 0
      }
    })

    it('should validate with "compile" and "validate" funcs with meta-schema', () => {
      let compileCalled
      testEvenKeyword$data({
        keyword: "x-even-$data",
        type: "number",
        $data: true,
        compile: compileEven,
        validate: validateEven,
        metaSchema: {type: "boolean"},
      })
      compileCalled.should.equal(true)
      shouldBeInvalidSchema({
        type: "number",
        "x-even-$data": "false",
      })

      function validateEven(schema, data) {
        return data % 2 ? !schema : schema
      }

      function compileEven(schema) {
        compileCalled = true
        return schema ? isEven : isOdd
      }

      function isEven(data) {
        return data % 2 === 0
      }
      function isOdd(data) {
        return data % 2 !== 0
      }
    })

    it('should validate rule with "macro" and "validate" funcs', () => {
      let macroCalled
      testEvenKeyword$data(
        {
          keyword: "x-even-$data",
          type: "number",
          $data: true,
          macro: macroEven,
          validate: validateEven,
        },
        2
      )
      macroCalled.should.equal(true)

      function validateEven(schema, data) {
        if (typeof schema != "boolean") return false
        return data % 2 ? !schema : schema
      }

      function macroEven(schema) {
        macroCalled = true
        if (schema === true) return {multipleOf: 2}
        if (schema === false) return {not: {multipleOf: 2}}
        throw new Error('Schema for "even" keyword should be boolean')
      }
    })

    it('should validate with "macro" and "validate" funcs with meta-schema', () => {
      let macroCalled
      testEvenKeyword$data(
        {
          keyword: "x-even-$data",
          type: "number",
          $data: true,
          macro: macroEven,
          validate: validateEven,
          metaSchema: {type: "boolean"},
        },
        2
      )
      macroCalled.should.equal(true)
      shouldBeInvalidSchema({
        type: "number",
        "x-even-$data": "false",
      })

      function validateEven(schema, data) {
        return data % 2 ? !schema : schema
      }

      function macroEven(schema): SchemaObject | void {
        macroCalled = true
        if (schema === true) return {multipleOf: 2}
        if (schema === false) return {not: {multipleOf: 2}}
      }
    })

    it('should validate rule with "code" keyword', () => {
      testEvenKeyword$data({
        keyword: "x-even-$data",
        type: "number",
        $data: true,
        code(cxt) {
          const {gen, schemaCode: s, data} = cxt
          gen.if(_`${s} !== undefined`)
          cxt.pass(_`typeof ${s} == "boolean" && (${data} % 2 ? !${s} : ${s})`)
        },
      })
    })

    it('should validate with "code" and meta-schema', () => {
      testEvenKeyword$data({
        keyword: "x-even-$data",
        type: "number",
        $data: true,
        code(cxt) {
          const {gen, schemaCode: s, data} = cxt
          gen.if(_`${s} !== undefined`)
          cxt.pass(_`typeof ${s} == "boolean" && (${data} % 2 ? !${s} : ${s})`)
        },
        metaSchema: {type: "boolean"},
      })
      shouldBeInvalidSchema({
        type: "number",
        "x-even-$data": "false",
      })
    })

    it('should fail if "macro" keyword definition has "$data" but no "code" or "validate"', () => {
      should.throw(() => {
        ajv.addKeyword({
          keyword: "even",
          type: "number",
          $data: true,
          macro: () => {
            return {}
          },
        })
      }, /\$data keyword must have "code" or "validate" function/)
    })

    it("should support schemaType with $data", () => {
      testEvenKeyword$data({
        keyword: "x-even-$data",
        type: "number",
        schemaType: "boolean",
        $data: true,
        validate: validateEven,
      })

      function validateEven(schema, data) {
        return data % 2 ? !schema : schema
      }
    })
  })

  function testEvenKeyword(evenDefinition, numErrors = 1) {
    instances.forEach((_ajv) => {
      _ajv.addKeyword(evenDefinition)
      const schema = {
        type: ["number", "string"],
        "x-even": true,
      }
      const validate = _ajv.compile(schema)

      shouldBeValid(validate, 2)
      shouldBeValid(validate, "abc")
      shouldBeInvalid(validate, 2.5, numErrors)
      shouldBeInvalid(validate, 3, numErrors)
    })
  }

  function testEvenKeyword$data(definition, numErrors = 1) {
    instances.forEach((_ajv) => {
      _ajv.addKeyword(definition)

      let schema: any = {
        type: ["number", "string"],
        "x-even-$data": true,
      }
      let validate = _ajv.compile(schema)

      shouldBeValid(validate, 2)
      shouldBeValid(validate, "abc")
      shouldBeInvalid(validate, 2.5, numErrors)
      shouldBeInvalid(validate, 3, numErrors)

      schema = {
        type: "object",
        properties: {
          data: {
            type: ["number", "string"],
            "x-even-$data": {$data: "1/evenValue"},
          },
          evenValue: {},
        },
      }
      validate = _ajv.compile(schema)

      shouldBeValid(validate, {data: 2, evenValue: true})
      shouldBeInvalid(validate, {data: 2, evenValue: false})
      shouldBeValid(validate, {data: "abc", evenValue: true})
      shouldBeValid(validate, {data: "abc", evenValue: false})
      shouldBeInvalid(validate, {data: 2.5, evenValue: true})
      shouldBeValid(validate, {data: 2.5, evenValue: false})
      shouldBeInvalid(validate, {data: 3, evenValue: true})
      shouldBeValid(validate, {data: 3, evenValue: false})

      shouldBeInvalid(validate, {data: 2, evenValue: "true"})

      // valid if the value of x-even-$data keyword is undefined
      shouldBeValid(validate, {data: 2})
      shouldBeValid(validate, {data: 3})
    })
  }

  function testConstantKeyword(definition, numErrors?: number) {
    instances.forEach((_ajv) => {
      _ajv.addKeyword(definition)

      const schema = {myConstant: "abc"}
      const validate = _ajv.compile(schema)

      shouldBeValid(validate, "abc")
      shouldBeInvalid(validate, 2, numErrors)
      shouldBeInvalid(validate, {}, numErrors)
    })
  }

  function testMultipleConstantKeyword(definition, numErrors?: number) {
    instances.forEach((_ajv) => {
      _ajv.addKeyword(definition)

      const schema = {
        type: ["object", "array"],
        properties: {
          a: {"x-constant": 1},
          b: {"x-constant": 1},
        },
        additionalProperties: {"x-constant": {foo: "bar"}},
        items: {"x-constant": {foo: "bar"}},
      }
      const validate = _ajv.compile(schema)

      shouldBeValid(validate, {a: 1, b: 1})
      shouldBeInvalid(validate, {a: 2, b: 1}, numErrors)

      shouldBeValid(validate, {a: 1, c: {foo: "bar"}})
      shouldBeInvalid(validate, {a: 1, c: {foo: "baz"}}, numErrors)

      shouldBeValid(validate, [{foo: "bar"}])
      shouldBeValid(validate, [{foo: "bar"}, {foo: "bar"}])

      shouldBeInvalid(validate, [1], numErrors)
    })
  }

  function testRangeKeyword(definition, createsErrors?: boolean, numErrors?: number) {
    instances.forEach((_ajv) => {
      _ajv.addKeyword(definition)
      _ajv.addKeyword({keyword: "exclusiveRange", schemaType: "boolean"})

      let schema: SchemaObject = {
        type: ["number", "string"],
        "x-range": [2, 4],
      }
      let validate = _ajv.compile(schema)

      shouldBeValid(validate, 2)
      shouldBeValid(validate, 3)
      shouldBeValid(validate, 4)
      shouldBeValid(validate, "abc")

      shouldBeInvalid(validate, 1.99, numErrors)
      if (createsErrors) {
        shouldBeRangeError(validate.errors?.[0], "", "#/x-range", ">=", 2)
      }
      shouldBeInvalid(validate, 4.01, numErrors)
      if (createsErrors) {
        shouldBeRangeError(validate.errors?.[0], "", "#/x-range", "<=", 4)
      }

      schema = {
        type: "object",
        properties: {
          foo: {
            type: ["number"],
            "x-range": [2, 4],
            exclusiveRange: true,
          },
        },
      }
      validate = _ajv.compile(schema)

      shouldBeValid(validate, {foo: 2.01})
      shouldBeValid(validate, {foo: 3})
      shouldBeValid(validate, {foo: 3.99})

      shouldBeInvalid(validate, {foo: 2}, numErrors)
      if (createsErrors) {
        shouldBeRangeError(validate.errors?.[0], "/foo", "#/properties/foo/x-range", ">", 2, true)
      }
      shouldBeInvalid(validate, {foo: 4}, numErrors)
      if (createsErrors) {
        shouldBeRangeError(validate.errors?.[0], "/foo", "#/properties/foo/x-range", "<", 4, true)
      }
    })
  }

  function testMultipleRangeKeyword(definition, numErrors?: number) {
    instances.forEach((_ajv) => {
      _ajv.opts.strictTypes = false
      _ajv.addKeyword(definition)
      _ajv.addKeyword({keyword: "exclusiveRange", schemaType: "boolean"})

      const schema = {
        properties: {
          a: {type: "number", "x-range": [2, 4], exclusiveRange: true},
          b: {type: "number", "x-range": [2, 4], exclusiveRange: false},
        },
        additionalProperties: {type: "number", "x-range": [5, 7]},
        items: {type: "number", "x-range": [5, 7]},
      }
      const validate = _ajv.compile(schema)

      shouldBeValid(validate, {a: 3.99, b: 4})
      shouldBeInvalid(validate, {a: 4, b: 4}, numErrors)

      shouldBeValid(validate, {a: 2.01, c: 7})
      shouldBeInvalid(validate, {a: 2.01, c: 7.01}, numErrors)

      shouldBeValid(validate, [5, 6, 7])
      shouldBeInvalid(validate, [7.01], numErrors)
    })
  }

  function shouldBeRangeError(error, dataPath, schemaPath, comparison, limit, exclusive?: boolean) {
    delete error.schema
    delete error.data
    error.should.eql({
      keyword: "x-range",
      dataPath: dataPath,
      schemaPath: schemaPath,
      message: "should be " + comparison + " " + limit,
      params: {
        comparison: comparison,
        limit: limit,
        exclusive: !!exclusive,
      },
    })
  }

  function validateRangeSchema(schema, parentSchema) {
    const schemaValid =
      Array.isArray(schema) &&
      schema.length === 2 &&
      typeof schema[0] == "number" &&
      typeof schema[1] == "number"
    if (!schemaValid) {
      throw new Error("Invalid schema for range keyword, should be array of 2 numbers")
    }

    const exclusiveRangeSchemaValid =
      parentSchema.exclusiveRange === undefined || typeof parentSchema.exclusiveRange == "boolean"
    if (!exclusiveRangeSchemaValid) {
      throw new Error("Invalid schema for exclusiveRange keyword, should be boolean")
    }
  }

  function shouldBeValid(validate, data) {
    validate(data).should.equal(true)
    should.not.exist(validate.errors)
  }

  function shouldBeInvalid(validate, data, numErrors = 1) {
    validate(data).should.equal(false)
    validate.errors.should.have.length(numErrors)
  }

  function shouldBeInvalidSchema(schema, msg: string | RegExp = /keyword value is invalid/) {
    instances.forEach((_ajv) => {
      should.throw(() => {
        _ajv.compile(schema)
      }, msg)
    })
  }

  describe("addKeyword method", () => {
    const TEST_TYPES = [undefined, "number", "string", "boolean", ["number", "string"]]

    it("should throw if defined keyword is passed", () => {
      testThrow(["minimum", "maximum", "multipleOf", "minLength", "maxLength"])
      testThrowDuplicate("user-defined")

      function testThrow(keywords) {
        TEST_TYPES.forEach((dataType, index) => {
          should.throw(() => {
            _addKeyword(keywords[index], dataType)
          }, /already defined/)
        })
      }

      function testThrowDuplicate(keywordPrefix) {
        let index = 0
        TEST_TYPES.forEach((dataType1) => {
          TEST_TYPES.forEach((dataType2) => {
            const keyword = keywordPrefix + index++
            _addKeyword(keyword, dataType1)
            should.throw(() => {
              _addKeyword(keyword, dataType2)
            }, /already defined/)
          })
        })
      }
    })

    it("should throw if keyword is not a valid name", () => {
      should.not.throw(() => {
        ajv.addKeyword("mykeyword")
      })

      should.not.throw(() => {
        ajv.addKeyword("hyphens-are-valid")
      })

      should.not.throw(() => {
        ajv.addKeyword("colons:are-valid")
      })

      should.throw(() => {
        ajv.addKeyword("single-'quote-not-valid")
      }, /invalid name/)

      should.throw(() => {
        ajv.addKeyword("3-start-with-number-not-valid")
      }, /invalid name/)

      should.throw(() => {
        ajv.addKeyword("-start-with-hyphen-not-valid")
      }, /invalid name/)

      should.throw(() => {
        ajv.addKeyword("spaces not valid")
      }, /invalid name/)
    })

    it("should return instance of itself", () => {
      const res = ajv.addKeyword("any")
      res.should.equal(ajv)
    })

    it("should throw if unknown type is passed", () => {
      should.throw(() => {
        _addKeyword("user-defined1", "wrongtype")
      }, /type must be JSONType/)

      should.throw(() => {
        _addKeyword("user-defined2", ["number", "wrongtype"])
      }, /type must be JSONType/)

      should.throw(() => {
        _addKeyword("user-defined3", ["number", undefined])
      }, /type must be JSONType/)
    })

    it("should support old API addKeyword", () => {
      ajv = new _Ajv({logger: false})
      //@ts-expect-error
      ajv.addKeyword("min", {
        type: "number",
        schemaType: "number",
        validate: (schema, data) => data >= schema,
      })
      const validate = ajv.compile({
        type: "number",
        min: 0,
      })
      validate(1).should.equal(true)
      validate(-1).should.equal(false)
    })

    function _addKeyword(keyword, dataType) {
      ajv.addKeyword({
        keyword,
        type: dataType,
        validate: () => true,
      })
    }
  })

  describe("getKeyword", () => {
    // TODO update this test
    it("should return false for unknown keywords", () => {
      ajv.getKeyword("unknown").should.equal(false)
    })

    // TODO change to account for pre-defined keywords with definitions
    it("should return keyword definition", () => {
      const definition = {
        keyword: "mykeyword",
        validate: () => true,
      }

      ajv.addKeyword(definition)
      const def = ajv.getKeyword("mykeyword")
      assert(typeof def == "object")
      def.keyword.should.equal("mykeyword")
    })
  })

  describe("removeKeyword", () => {
    it("should remove and allow redefining keyword", () => {
      ajv = new _Ajv({strict: false})

      ajv.addKeyword({
        keyword: "positive",
        type: "number",
        validate: (_schema, data) => data > 0,
      })

      const schema = {type: "number", positive: true}

      let validate = ajv.compile(schema)
      validate(0).should.equal(false)
      validate(1).should.equal(true)

      should.throw(() => {
        ajv.addKeyword({
          keyword: "positive",
          type: "number",
          validate: function (_sch, data) {
            return data >= 0
          },
        })
      }, /already defined/)

      ajv.removeKeyword("positive")
      ajv.removeSchema(schema)
      validate = ajv.compile(schema)
      validate(-1).should.equal(true)
      ajv.removeSchema(schema)

      ajv.addKeyword({
        keyword: "positive",
        type: "number",
        validate: function (_sch, data) {
          return data >= 0
        },
      })

      validate = ajv.compile(schema)
      validate(-1).should.equal(false)
      validate(0).should.equal(true)
      validate(1).should.equal(true)
    })

    it("should remove and allow redefining standard keyword", () => {
      ajv = new _Ajv({strict: false})

      const schema = {minimum: 1}
      let validate = ajv.compile(schema)
      validate(0).should.equal(false)
      validate(1).should.equal(true)
      validate(2).should.equal(true)

      ajv.removeKeyword("minimum")
      ajv.removeSchema(schema)

      validate = ajv.compile(schema)
      validate(0).should.equal(true)
      validate(1).should.equal(true)
      validate(2).should.equal(true)

      ajv.addKeyword({
        keyword: "minimum",
        type: "number",
        // make minimum exclusive
        validate: (sch, data) => data > sch,
      })
      ajv.removeSchema(schema)

      validate = ajv.compile(schema)
      validate(0).should.equal(false)
      validate(1).should.equal(false)
      validate(2).should.equal(true)
    })

    it("should return instance of itself", () => {
      const res = ajv.addKeyword("any").removeKeyword("any")
      res.should.equal(ajv)
    })
  })

  describe("user-defined keywords mutating data", () => {
    it("should NOT update data without option modifying", () => {
      should.throw(() => {
        testModifying(false)
      }, /expected false to equal true/)
    })

    it("should update data with option modifying", () => {
      testModifying(true)
    })

    function testModifying(withOption) {
      const collectionFormat = {
        csv: function (data, {parentData, parentDataProperty}) {
          parentData[parentDataProperty] = data.split(",")
          return true
        },
      }

      ajv.addKeyword({
        keyword: "collectionFormat",
        type: "string",
        modifying: withOption,
        compile: function (schema) {
          return collectionFormat[schema]
        },
        metaSchema: {
          enum: ["csv"],
        },
      })

      const validate = ajv.compile({
        type: "object",
        properties: {
          foo: {
            allOf: [
              {
                type: "string",
                collectionFormat: "csv",
              },
              {
                type: "array",
                items: {type: "string"},
              },
            ],
          },
        },
        additionalProperties: false,
      })

      const obj: any = {foo: "bar,baz,quux"}

      validate(obj).should.equal(true)
      obj.should.eql({foo: ["bar", "baz", "quux"]})
    }
  })

  describe('"validate" keywords with predefined validation result', () => {
    it("should ignore result from validation function", () => {
      ajv.addKeyword({
        keyword: "pass",
        validate: () => false,
        valid: true,
      })

      ajv.addKeyword({
        keyword: "fail",
        validate: () => true,
        valid: false,
      })

      ajv.validate({pass: ""}, 1).should.equal(true)
      ajv.validate({fail: ""}, 1).should.equal(false)
    })
  })

  describe('"dependencies" in keyword definition', () => {
    it("should require properties in the parent schema", () => {
      ajv.addKeyword({
        keyword: "allRequired",
        type: "object",
        macro: (schema, parentSchema) =>
          schema ? {required: Object.keys(parentSchema.properties)} : true,
        schemaType: "boolean",
        dependencies: ["properties"],
      })

      const invalidSchema = {
        type: "object",
        allRequired: true,
      }

      should.throw(() => {
        ajv.compile(invalidSchema)
      }, /parent schema must have dependencies of allRequired: properties/)

      const schema = {
        type: "object",
        properties: {
          foo: true,
        },
        allRequired: true,
      }

      const v = ajv.compile(schema)
      v({foo: 1}).should.equal(true)
      v({}).should.equal(false)
    })
  })
})
