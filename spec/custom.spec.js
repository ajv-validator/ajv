'use strict';

var getAjvInstances = require('./ajv_instances')
  , should = require('./chai').should()
  , equal = require('../lib/compile/equal')
  , customRules = require('./custom_rules');


describe('Custom keywords', function () {
  var ajv, instances;

  beforeEach(function() {
    instances = getAjvInstances({
      allErrors:    true,
      verbose:      true,
      inlineRefs:   false
    });
    ajv = instances[0];
  });


  describe('custom rules', function() {
    describe('rule with "interpreted" keyword validation', function() {
      it('should add and validate rule', function() {
        testEvenKeyword({ type: 'number', validate: validateEven });

        function validateEven(schema, data) {
          if (typeof schema != 'boolean') throw new Error('The value of "even" keyword must be boolean');
          return data % 2 ? !schema : schema;
        }
      });

      it('should add, validate keyword schema and validate rule', function() {
        testEvenKeyword({
          type: 'number',
          validate: validateEven,
          metaSchema: { "type": "boolean" }
        });

        shouldBeInvalidSchema({ "even": "not_boolean" });

        function validateEven(schema, data) {
          return data % 2 ? !schema : schema;
        }
      });

      it('should pass parent schema to "interpreted" keyword validation', function() {
        testRangeKeyword({
          type: 'number',
          validate: validateRange
        });

        function validateRange(schema, data, parentSchema) {
          validateRangeSchema(schema, parentSchema);

          return parentSchema.exclusiveRange === true
                  ? data > schema[0] && data < schema[1]
                  : data >= schema[0] && data <= schema[1];
        }
      });

      it('should validate meta schema and pass parent schema to "interpreted" keyword validation', function() {
        testRangeKeyword({
          type: 'number',
          validate: validateRange,
          metaSchema: {
            "type": "array",
            "items": [ { "type": "number" }, { "type": "number" } ],
            "additionalItems": false
          }
        });
        shouldBeInvalidSchema({ range: [ "1", 2 ] });
        shouldBeInvalidSchema({ range: {} });
        shouldBeInvalidSchema({ range: [ 1, 2, 3 ] });

        function validateRange(schema, data, parentSchema) {
          return parentSchema.exclusiveRange === true
                  ? data > schema[0] && data < schema[1]
                  : data >= schema[0] && data <= schema[1];
        }
      });

      it('should allow defining custom errors for "interpreted" keyword', function() {
        testRangeKeyword({ type: 'number', validate: validateRange }, true);

        function validateRange(schema, data, parentSchema) {
          validateRangeSchema(schema, parentSchema);
          var min = schema[0]
            , max = schema[1]
            , exclusive = parentSchema.exclusiveRange === true;

          var minOk = exclusive ? data > min : data >= min;
          var maxOk = exclusive ? data < max : data <= max;
          var valid = minOk && maxOk;

          if (!valid) {
            var err = { keyword: 'range' };
            validateRange.errors = [err];
            var comparison, limit;
            if (minOk) {
              comparison = exclusive ? '<' : '<=';
              limit = max;
            } else {
              comparison = exclusive ? '>' : '>=';
              limit = min;
            }
            err.message = 'should be ' + comparison + ' ' + limit;
            err.params = {
              comparison: comparison,
              limit: limit,
              exclusive: exclusive
            };
          }

          return valid;
        }
      });
    });


    describe('rule with "compiled" keyword validation', function() {
      it('should add and validate rule', function() {
        testEvenKeyword({ type: 'number', compile: compileEven });
        shouldBeInvalidSchema({ "even": "not_boolean" });

        function compileEven(schema) {
          if (typeof schema != 'boolean') throw new Error('The value of "even" keyword must be boolean');
          return schema ? isEven : isOdd;
        }

        function isEven(data) { return data % 2 === 0; }
        function isOdd(data) { return data % 2 !== 0; }
      });

      it('should add, validate keyword schema and validate rule', function() {
        testEvenKeyword({
          type: 'number',
          compile: compileEven,
          metaSchema: { "type": "boolean" }
        });
        shouldBeInvalidSchema({ "even": "not_boolean" });

        function compileEven(schema) {
          return schema ? isEven : isOdd;
        }

        function isEven(data) { return data % 2 === 0; }
        function isOdd(data) { return data % 2 !== 0; }
      });

      it('should compile keyword validating function only once per schema', function () {
        testConstantKeyword({ compile: compileConstant });
      });

      it('should allow multiple schemas for the same keyword', function () {
        testMultipleConstantKeyword({ compile: compileConstant });
      });

      it('should pass parent schema to "compiled" keyword validation', function() {
        testRangeKeyword({ type: 'number', compile: compileRange });
      });

      it('should allow multiple parent schemas for the same keyword', function () {
        testMultipleRangeKeyword({ type: 'number', compile: compileRange });
      });
    });


    function compileConstant(schema) {
      return typeof schema == 'object' && schema !== null
              ? isDeepEqual
              : isStrictEqual;

      function isDeepEqual(data) { return equal(data, schema); }
      function isStrictEqual(data) { return data === schema; }
    }

    function compileRange(schema, parentSchema) {
      validateRangeSchema(schema, parentSchema);

      var min = schema[0];
      var max = schema[1];

      return parentSchema.exclusiveRange === true
              ? function (data) { return data > min && data < max; }
              : function (data) { return data >= min && data <= max; };
    }
  });


  describe('macro rules', function() {
    it('should add and validate rule with "macro" keyword', function() {
      testEvenKeyword({ type: 'number', macro: macroEven }, 2);
    });

    it('should add and expand macro rule', function() {
      testConstantKeyword({ macro: macroConstant }, 2);
    });

    it('should allow multiple schemas for the same macro keyword', function () {
      testMultipleConstantKeyword({ macro: macroConstant }, 2);
    });

    it('should pass parent schema to "macro" keyword', function() {
      testRangeKeyword({ type: 'number', macro: macroRange }, undefined, 2);
    });

    it('should allow multiple parent schemas for the same macro keyword', function () {
      testMultipleRangeKeyword({ type: 'number', macro: macroRange }, 2);
    });

    it('should recursively expand macro keywords', function() {
      instances.forEach(function (_ajv) {
        _ajv.addKeyword('deepProperties', { type: 'object', macro: macroDeepProperties });
        _ajv.addKeyword('range', { type: 'number', macro: macroRange });

        var schema = {
          "deepProperties": {
            "a.b.c": { "type": "number", "range": [2,4] },
            "d.e.f.g": { "type": "string" }
          }
        };

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

        var validate = _ajv.compile(schema);

        shouldBeValid(validate, {
          a: {b: {c: 3}},
          d: {e: {f: {g: 'foo'}}}
        });

        shouldBeInvalid(validate, {
          a: {b: {c: 5}}, // out of range
          d: {e: {f: {g: 'foo'}}}
        }, 5);

        shouldBeInvalid(validate, {
          a: {b: {c: 'bar'}}, // not number
          d: {e: {f: {g: 'foo'}}}
        }, 4);

        shouldBeInvalid(validate, {
          a: {b: {c: 3}},
          d: {e: {f: {g: 2}}} // not string
        }, 5);

        function macroDeepProperties(_schema) {
          if (typeof _schema != 'object')
            throw new Error('schema of deepProperty should be an object');

          var expanded = [];

          for (var prop in _schema) {
            var path = prop.split('.');
            var properties = {};
            if (path.length == 1) {
              properties[prop] = _schema[prop];
            } else {
              var deepProperties = {};
              deepProperties[path.slice(1).join('.')] = _schema[prop];
              properties[path[0]] = { "deepProperties": deepProperties };
            }
            expanded.push({ "properties": properties });
          }

          return expanded.length == 1 ? expanded[0] : { "allOf": expanded };
        }
      });
    });

    it('should correctly expand multiple macros on the same level', function() {
      instances.forEach(function (_ajv) {
        _ajv.addKeyword('range', { type: 'number', macro: macroRange });
        _ajv.addKeyword('even', { type: 'number', macro: macroEven });

        var schema = {
          "range": [4,6],
          "even": true
        };

        var validate = _ajv.compile(schema);
        var numErrors = _ajv._opts.allErrors ? 4 : 2;

        shouldBeInvalid(validate, 2, 2);
        shouldBeInvalid(validate, 3, numErrors);
        shouldBeValid(validate, 4);
        shouldBeInvalid(validate, 5, 2);
        shouldBeValid(validate, 6);
        shouldBeInvalid(validate, 7, numErrors);
        shouldBeInvalid(validate, 8, 2);
      });
    });

    it('should validate macro keyword when it resolves to the same keyword as exists', function() {
      instances.forEach(function (_ajv) {
        _ajv.addKeyword('range', { type: 'number', macro: macroRange });

        var schema = {
          "range": [1,4],
          "minimum": 2.5
        };

        var validate = _ajv.compile(schema);

        shouldBeValid(validate, 3);
        shouldBeInvalid(validate, 2);
      });
    });

    it('should correctly expand macros in subschemas', function() {
      instances.forEach(function (_ajv) {
        _ajv.addKeyword('range', { type: 'number', macro: macroRange });

        var schema = {
          "allOf": [
            { "range": [4,8] },
            { "range": [2,6] }
          ]
        };

        var validate = _ajv.compile(schema);

        shouldBeInvalid(validate, 2, 2);
        shouldBeInvalid(validate, 3, 2);
        shouldBeValid(validate, 4);
        shouldBeValid(validate, 5);
        shouldBeValid(validate, 6);
        shouldBeInvalid(validate, 7, 2);
        shouldBeInvalid(validate, 8, 2);
      });
    });

    it('should correctly expand macros in macro expansions', function() {
      instances.forEach(function (_ajv) {
        _ajv.addKeyword('range', { type: 'number', macro: macroRange });
        _ajv.addKeyword('contains', { type: 'array', macro: macroContains });

        var schema = {
          "contains": {
            "type": "number",
            "range": [4,7],
            "exclusiveRange": true
          }
        };

        var validate = _ajv.compile(schema);

        shouldBeInvalid(validate, [1,2,3], 2);
        shouldBeInvalid(validate, [2,3,4], 2);
        shouldBeValid(validate, [3,4,5]); // only 5 is in range
        shouldBeValid(validate, [6,7,8]); // only 6 is in range
        shouldBeInvalid(validate, [7,8,9], 2);
        shouldBeInvalid(validate, [8,9,10], 2);

        function macroContains(_schema) {
          return { "not": { "items": { "not": _schema } } };
        }
      });
    });

    it('should throw exception if macro expansion is an invalid schema', function() {
      ajv.addKeyword('invalid', { macro: macroInvalid });
      var schema = { "invalid": true };

      should.throw(function() {
        ajv.compile(schema);
      });

      function macroInvalid(/* schema */) {
        return { "type": "invalid" };
      }
    });

    function macroEven(schema) {
      if (schema === true) return { "multipleOf": 2 };
      if (schema === false) return { "not": { "multipleOf": 2 } };
      throw new Error('Schema for "even" keyword should be boolean');
    }

    function macroConstant(schema/*, parentSchema */) {
      return { "enum": [schema] };
    }

    function macroRange(schema, parentSchema) {
      validateRangeSchema(schema, parentSchema);
      var exclusive = !!parentSchema.exclusiveRange;

      return {
        minimum: schema[0],
        exclusiveMinimum: exclusive,
        maximum: schema[1],
        exclusiveMaximum: exclusive
      };
    }
  });


  describe('inline rules', function() {
    it('should add and validate rule with "inline" code keyword', function() {
      testEvenKeyword({ type: 'number', inline: inlineEven });
    });

    it('should pass parent schema to "inline" keyword', function() {
      testRangeKeyword({ type: 'number', inline: inlineRange, statements: true });
    });

    it('should define "inline" keyword as template', function() {
      var inlineRangeTemplate = customRules.range;

      testRangeKeyword({
        type: 'number',
        inline: inlineRangeTemplate,
        statements: true
      });
    });

    it('should define "inline" keyword without errors', function() {
      var inlineRangeTemplate = customRules.range;

      testRangeKeyword({
        type: 'number',
        inline: inlineRangeTemplate,
        statements: true,
        errors: false
      });
    });

    it('should allow defining optional errors', function() {
      var inlineRangeTemplate = customRules.rangeWithErrors;

      testRangeKeyword({
        type: 'number',
        inline: inlineRangeTemplate,
        statements: true
      }, true);
    });

    it('should allow defining required errors', function() {
      var inlineRangeTemplate = customRules.rangeWithErrors;

      testRangeKeyword({
        type: 'number',
        inline: inlineRangeTemplate,
        statements: true,
        errors: true
      }, true);
    });


    function inlineEven(it, keyword, schema) {
      var op = schema ? '===' : '!==';
      return 'data' + (it.dataLevel || '') + ' % 2 ' + op + ' 0';
    }

    function inlineRange(it, keyword, schema, parentSchema) {
      var min = schema[0]
        , max = schema[1]
        , data = 'data' + (it.dataLevel || '')
        , gt = parentSchema.exclusiveRange ? ' > ' : ' >= '
        , lt = parentSchema.exclusiveRange ? ' < ' : ' <= ';
      return 'var valid' + it.level + ' = ' + data + gt + min + ' && ' + data + lt + max + ';';
    }
  });


  describe('$data reference support with custom keywords (v5 only)', function() {
    beforeEach(function() {
      instances = getAjvInstances({
        allErrors:    true,
        verbose:      true,
        inlineRefs:   false
      }, { v5: true });
      ajv = instances[0];
    });

    it('should validate "interpreted" rule', function() {
      testEvenKeyword$data({
        type: 'number',
        $data: true,
        validate: validateEven
      });

      function validateEven(schema, data) {
        if (typeof schema != 'boolean') return false;
        return data % 2 ? !schema : schema;
      }
    });

    it('should validate rule with "compile" and "validate" funcs', function() {
      var compileCalled;
      testEvenKeyword$data({
        type: 'number',
        $data: true,
        compile: compileEven,
        validate: validateEven
      });
      compileCalled .should.equal(true);

      function validateEven(schema, data) {
        if (typeof schema != 'boolean') return false;
        return data % 2 ? !schema : schema;
      }

      function compileEven(schema) {
        compileCalled = true;
        if (typeof schema != 'boolean') throw new Error('The value of "even" keyword must be boolean');
        return schema ? isEven : isOdd;
      }

      function isEven(data) { return data % 2 === 0; }
      function isOdd(data) { return data % 2 !== 0; }
    });

    it('should validate with "compile" and "validate" funcs with meta-schema', function() {
      var compileCalled;
      testEvenKeyword$data({
        type: 'number',
        $data: true,
        compile: compileEven,
        validate: validateEven,
        metaSchema: { "type": "boolean" }
      });
      compileCalled .should.equal(true);
      shouldBeInvalidSchema({ "even": "false" });

      function validateEven(schema, data) {
        return data % 2 ? !schema : schema;
      }

      function compileEven(schema) {
        compileCalled = true;
        return schema ? isEven : isOdd;
      }

      function isEven(data) { return data % 2 === 0; }
      function isOdd(data) { return data % 2 !== 0; }
    });

    it('should validate rule with "macro" and "validate" funcs', function() {
      var macroCalled;
      testEvenKeyword$data({
        type: 'number',
        $data: true,
        macro: macroEven,
        validate: validateEven
      }, 2);
      macroCalled .should.equal(true);

      function validateEven(schema, data) {
        if (typeof schema != 'boolean') return false;
        return data % 2 ? !schema : schema;
      }

      function macroEven(schema) {
        macroCalled = true;
        if (schema === true) return { "multipleOf": 2 };
        if (schema === false) return { "not": { "multipleOf": 2 } };
        throw new Error('Schema for "even" keyword should be boolean');
      }
    });

    it('should validate with "macro" and "validate" funcs with meta-schema', function() {
      var macroCalled;
      testEvenKeyword$data({
        type: 'number',
        $data: true,
        macro: macroEven,
        validate: validateEven,
        metaSchema: { "type": "boolean" }
      }, 2);
      macroCalled .should.equal(true);
      shouldBeInvalidSchema({ "even": "false" });

      function validateEven(schema, data) {
        return data % 2 ? !schema : schema;
      }

      function macroEven(schema) {
        macroCalled = true;
        if (schema === true) return { "multipleOf": 2 };
        if (schema === false) return { "not": { "multipleOf": 2 } };
      }
    });

    it('should validate rule with "inline" and "validate" funcs', function() {
      var inlineCalled;
      testEvenKeyword$data({
        type: 'number',
        $data: true,
        inline: inlineEven,
        validate: validateEven
      });
      inlineCalled .should.equal(true);

      function validateEven(schema, data) {
        if (typeof schema != 'boolean') return false;
        return data % 2 ? !schema : schema;
      }

      function inlineEven(it, keyword, schema) {
        inlineCalled = true;
        var op = schema ? '===' : '!==';
        return 'data' + (it.dataLevel || '') + ' % 2 ' + op + ' 0';
      }
    });

    it('should validate with "inline" and "validate" funcs with meta-schema', function() {
      var inlineCalled;
      testEvenKeyword$data({
        type: 'number',
        $data: true,
        inline: inlineEven,
        validate: validateEven,
        metaSchema: { "type": "boolean" }
      });
      inlineCalled .should.equal(true);
      shouldBeInvalidSchema({ "even": "false" });

      function validateEven(schema, data) {
        return data % 2 ? !schema : schema;
      }

      function inlineEven(it, keyword, schema) {
        inlineCalled = true;
        var op = schema ? '===' : '!==';
        return 'data' + (it.dataLevel || '') + ' % 2 ' + op + ' 0';
      }
    });

    it('should fail if keyword definition has "$data" but no "validate"', function() {
      should.throw(function() {
        ajv.addKeyword('even', {
          type: 'number',
          $data: true,
          macro: function() { return {}; }
        });
      });
    });
  });


  function testEvenKeyword(definition, numErrors) {
    instances.forEach(function (_ajv) {
      _ajv.addKeyword('even', definition);
      var schema = { "even": true };
      var validate = _ajv.compile(schema);

      shouldBeValid(validate, 2);
      shouldBeValid(validate, 'abc');
      shouldBeInvalid(validate, 2.5, numErrors);
      shouldBeInvalid(validate, 3, numErrors);
    });
  }

  function testEvenKeyword$data(definition, numErrors) {
    instances.forEach(function (_ajv) {
      _ajv.addKeyword('even', definition);

      var schema = { "even": true };
      var validate = _ajv.compile(schema);

      shouldBeValid(validate, 2);
      shouldBeValid(validate, 'abc');
      shouldBeInvalid(validate, 2.5, numErrors);
      shouldBeInvalid(validate, 3, numErrors);

      schema = {
        "properties": {
          "data": { "even": { "$data": "1/evenValue" } },
          "evenValue": {}
        }
      };
      validate = _ajv.compile(schema);

      shouldBeValid(validate, { data: 2, evenValue: true });
      shouldBeInvalid(validate, { data: 2, evenValue: false });
      shouldBeValid(validate, { data: 'abc', evenValue: true });
      shouldBeValid(validate, { data: 'abc', evenValue: false });
      shouldBeInvalid(validate, { data: 2.5, evenValue: true });
      shouldBeValid(validate, { data: 2.5, evenValue: false });
      shouldBeInvalid(validate, { data: 3, evenValue: true });
      shouldBeValid(validate, { data: 3, evenValue: false });

      shouldBeInvalid(validate, { data: 2, evenValue: "true" });
    });
  }

  function testConstantKeyword(definition, numErrors) {
    instances.forEach(function (_ajv) {
      _ajv.addKeyword('constant', definition);

      var schema = { "constant": "abc" };
      var validate = _ajv.compile(schema);

      shouldBeValid(validate, 'abc');
      shouldBeInvalid(validate, 2, numErrors);
      shouldBeInvalid(validate, {}, numErrors);
    });
  }

  function testMultipleConstantKeyword(definition, numErrors) {
    instances.forEach(function (_ajv) {
      _ajv.addKeyword('constant', definition);

      var schema = {
        "properties": {
          "a": { "constant": 1 },
          "b": { "constant": 1 }
        },
        "additionalProperties": { "constant": { "foo": "bar" } },
        "items": { "constant": { "foo": "bar" } }
      };
      var validate = _ajv.compile(schema);

      shouldBeValid(validate, {a:1, b:1});
      shouldBeInvalid(validate, {a:2, b:1}, numErrors);

      shouldBeValid(validate, {a:1, c: {foo: 'bar'}});
      shouldBeInvalid(validate, {a:1, c: {foo: 'baz'}}, numErrors);

      shouldBeValid(validate, [{foo: 'bar'}]);
      shouldBeValid(validate, [{foo: 'bar'}, {foo: 'bar'}]);

      shouldBeInvalid(validate, [1], numErrors);
    });
  }

  function testRangeKeyword(definition, customErrors, numErrors) {
    instances.forEach(function (_ajv) {
      _ajv.addKeyword('range', definition);

      var schema = { "range": [2, 4] };
      var validate = _ajv.compile(schema);

      shouldBeValid(validate, 2);
      shouldBeValid(validate, 3);
      shouldBeValid(validate, 4);
      shouldBeValid(validate, 'abc');

      shouldBeInvalid(validate, 1.99, numErrors);
      if (customErrors) shouldBeRangeError(validate.errors[0], '', '#/range', '>=', 2);
      shouldBeInvalid(validate, 4.01, numErrors);
      if (customErrors) shouldBeRangeError(validate.errors[0], '', '#/range','<=', 4);

      schema = {
        "properties": {
          "foo": {
            "range": [2, 4],
            "exclusiveRange": true
          }
        }
      };
      validate = _ajv.compile(schema);

      shouldBeValid(validate, { foo: 2.01 });
      shouldBeValid(validate, { foo: 3 });
      shouldBeValid(validate, { foo: 3.99 });

      shouldBeInvalid(validate, { foo: 2 }, numErrors);
      if (customErrors) shouldBeRangeError(validate.errors[0], '.foo', '#/properties/foo/range', '>', 2, true);
      shouldBeInvalid(validate, { foo: 4 }, numErrors);
      if (customErrors) shouldBeRangeError(validate.errors[0], '.foo', '#/properties/foo/range', '<', 4, true);
    });
  }

  function testMultipleRangeKeyword(definition, numErrors) {
    instances.forEach(function (_ajv) {
      _ajv.addKeyword('range', definition);

      var schema = {
        "properties": {
          "a": { "range": [2, 4], "exclusiveRange": true },
          "b": { "range": [2, 4], "exclusiveRange": false }
        },
        "additionalProperties": { "range": [5, 7] },
        "items": { "range": [5, 7] }
      };
      var validate = _ajv.compile(schema);

      shouldBeValid(validate, {a:3.99, b:4});
      shouldBeInvalid(validate, {a:4, b:4}, numErrors);

      shouldBeValid(validate, {a:2.01, c: 7});
      shouldBeInvalid(validate, {a:2.01, c: 7.01}, numErrors);

      shouldBeValid(validate, [5, 6, 7]);
      shouldBeInvalid(validate, [7.01], numErrors);
    });
  }

  function shouldBeRangeError(error, dataPath, schemaPath, comparison, limit, exclusive) {
    delete error.schema;
    delete error.data;
    error .should.eql({
      keyword: 'range',
      dataPath: dataPath,
      schemaPath: schemaPath,
      message: 'should be ' + comparison + ' ' + limit,
      params: {
        comparison: comparison,
        limit: limit,
        exclusive: !!exclusive
      }
    });
  }

  function validateRangeSchema(schema, parentSchema) {
    var schemaValid = Array.isArray(schema) && schema.length == 2
                      && typeof schema[0] == 'number'
                      && typeof schema[1] == 'number';
    if (!schemaValid) throw new Error('Invalid schema for range keyword, should be array of 2 numbers');

    var exclusiveRangeSchemaValid = parentSchema.exclusiveRange === undefined
                                    || typeof parentSchema.exclusiveRange == 'boolean';
    if (!exclusiveRangeSchemaValid) throw new Error('Invalid schema for exclusiveRange keyword, should be bolean');
  }

  function shouldBeValid(validate, data) {
    validate(data) .should.equal(true);
    should.not.exist(validate.errors);
  }

  function shouldBeInvalid(validate, data, numErrors) {
    validate(data) .should.equal(false);
    validate.errors .should.have.length(numErrors || 1);
  }

  function shouldBeInvalidSchema(schema) {
    instances.forEach(function (_ajv) {
      should.throw(function() {
        _ajv.compile(schema);
      });
    });
  }

  describe('addKeyword method', function() {
    var TEST_TYPES = [ undefined, 'number', 'string', 'boolean', ['number', 'string']];

    it('should throw if defined keyword is passed', function() {
      testThrow(['minimum', 'maximum', 'multipleOf', 'minLength', 'maxLength']);
      testThrowDuplicate('custom');

      function testThrow(keywords) {
        TEST_TYPES.forEach(function (dataType, index) {
          should.throw(function(){
            addKeyword(keywords[index], dataType);
          });
        });
      }

      function testThrowDuplicate(keywordPrefix) {
        var index = 0;
        TEST_TYPES.forEach(function (dataType1) {
          TEST_TYPES.forEach(function (dataType2) {
            var keyword = keywordPrefix + (index++);
            addKeyword(keyword, dataType1);
            should.throw(function() {
              addKeyword(keyword, dataType2);
            });
          });
        });
      }
    });

    it('should throw if keyword is not a valid identifier', function() {
      should.not.throw(function() {
        ajv.addKeyword('mykeyword', {
          validate: function() { return true; }
        });
      });

      should.throw(function() {
        ajv.addKeyword('my-keyword', {
          validate: function() { return true; }
        });
      });
    });

    it('should throw if unknown type is passed', function() {
      should.throw(function() {
        addKeyword('custom1', 'wrongtype');
      });

      should.throw(function() {
        addKeyword('custom2', ['number', 'wrongtype']);
      });

      should.throw(function() {
        addKeyword('custom3', ['number', undefined]);
      });
    });

    function addKeyword(keyword, dataType) {
      ajv.addKeyword(keyword, {
        type: dataType,
        validate: function() {}
      });
    }
  });
});
