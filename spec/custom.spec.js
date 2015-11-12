'use strict';


var Ajv = require(typeof window == 'object' ? 'ajv' : '../lib/ajv')
  , should = require('chai').should()
  , getAjvInstances = require('./ajv_instances')
  , equal = require('../lib/compile/equal');


describe('Custom keywords', function () {
  var ajv, instances;

  beforeEach(function() {
    instances = getAjvInstances({
      allErrors:    true,
      verbose:      true,
      inlineRefs:   false,
      i18n:         true
    });
    ajv = instances[0];
  });

  describe('custom rules', function() {
    var compileCount = 0;

    it('should add and validate rule with "interpreted" keyword validation', function() {
      testAddEvenKeyword({ type: 'number', validate: validateEven });

      function validateEven(schema, data) {
        if (typeof schema != 'boolean') throw new Error('The value of "even" keyword must be boolean');
        return data % 2 ? !schema : schema;
      }
    });

    it('should add and validate rule with "compiled" keyword validation', function() {
      testAddEvenKeyword({ type: 'number', compile: compileEven });

      function compileEven(schema) {
        if (typeof schema != 'boolean') throw new Error('The value of "even" keyword must be boolean');
        return schema ? isEven : isOdd;
      }

      function isEven(data) { return data % 2 === 0; }
      function isOdd(data) { return data % 2 !== 0; }
    });

    it('should compile keyword validating function only once per schema', function () {
      instances.forEach(function (ajv) {
        ajv.addKeyword('constant', { compile: compileConstant });

        var schema = { "constant": "abc" };
        compileCount = 0;
        var validate = ajv.compile(schema);
        should.equal(compileCount, 1);

        shouldBeValid(validate, 'abc');
        shouldBeInvalid(validate, 2);
        shouldBeInvalid(validate, {});
      });
    });

    it('should allow multiple schemas for the same keyword', function () {
      instances.forEach(function (ajv) {
        ajv.addKeyword('constant', { compile: compileConstant });

        var schema = {
          "properties": {
            "a": { "constant": 1 },
            "b": { "constant": 1 }
          },
          "additionalProperties": { "constant": { "foo": "bar" } },
          "items": { "constant": { "foo": "bar" } }
        };
        compileCount = 0;
        var validate = ajv.compile(schema);
        should.equal(compileCount, 2);

        shouldBeValid(validate, {a:1, b:1});
        shouldBeInvalid(validate, {a:2, b:1});

        shouldBeValid(validate, {a:1, c: {foo: 'bar'}});
        shouldBeInvalid(validate, {a:1, c: {foo: 'baz'}});

        shouldBeValid(validate, [{foo: 'bar'}]);
        shouldBeValid(validate, [{foo: 'bar'}, {foo: 'bar'}]);

        shouldBeInvalid(validate, [1]);
      });
    });

    it('should pass parent schema to "interpreted" keyword validation', function() {
      testRangeKeyword({ type: 'number', validate: validateRange });

      function validateRange(schema, data, parentSchema) {
        validateRangeSchema(schema, parentSchema);

        return parentSchema.exclusiveRange === true
                ? data > schema[0] && data < schema[1]
                : data >= schema[0] && data <= schema[1];
      }
    });

    it('should pass parent schema to "compiled" keyword validation', function() {
      testRangeKeyword({ type: 'number', compile: compileRange });
    });

    it('should allow multiple parent schemas for the same keyword', function () {
      instances.forEach(function (ajv) {
        ajv.addKeyword('range', { type: 'number', compile: compileRange });

        var schema = {
          "properties": {
            "a": { "range": [2, 4], "exclusiveRange": true },
            "b": { "range": [2, 4], "exclusiveRange": false }
          },
          "additionalProperties": { "range": [5, 7] },
          "items": { "range": [5, 7] }
        };
        compileCount = 0;
        var validate = ajv.compile(schema);
        should.equal(compileCount, 3);

        shouldBeValid(validate, {a:3.99, b:4});
        shouldBeInvalid(validate, {a:4, b:4});

        shouldBeValid(validate, {a:2.01, c: 7});
        shouldBeInvalid(validate, {a:2.01, c: 7.01});

        shouldBeValid(validate, [5, 6, 7]);
        shouldBeInvalid(validate, [7.01]);
      });
    });

    function compileConstant(schema) {
      compileCount++;
      return typeof schema == 'object' && schema !== null
              ? isDeepEqual
              : isStrictEqual;

      function isDeepEqual(data) { return equal(data, schema); }
      function isStrictEqual(data) { return data === schema; }
    }

    function compileRange(schema, parentSchema) {
      compileCount++;
      validateRangeSchema(schema, parentSchema);

      var min = schema[0];
      var max = schema[1];

      return parentSchema.exclusiveRange === true
              ? function (data) { return data > min && data < max; }
              : function (data) { return data >= min && data <= max; }
    }

    function testAddEvenKeyword(definition) {
      instances.forEach(function (ajv) {
        ajv.addKeyword('even', definition);
        var schema = { "even": true };
        var validate = ajv.compile(schema);

        shouldBeValid(validate, 2);
        shouldBeValid(validate, 'abc');
        shouldBeInvalid(validate, 2.5);
        shouldBeInvalid(validate, 3);
      });
    }

    function testRangeKeyword(definition) {
      instances.forEach(function (ajv) {
        ajv.addKeyword('range', definition);

        var schema = { "range": [2, 4] };
        var validate = ajv.compile(schema);

        shouldBeValid(validate, 2);
        shouldBeValid(validate, 3);
        shouldBeValid(validate, 4);
        shouldBeValid(validate, 'abc');

        shouldBeInvalid(validate, 1.99);
        shouldBeInvalid(validate, 4.01);

        var schema = {
          "properties": {
            "foo": {
              "range": [2, 4],
              "exclusiveRange": true
            }
          }
        };
        var validate = ajv.compile(schema);

        shouldBeValid(validate, { foo: 2.01 });
        shouldBeValid(validate, { foo: 3 });
        shouldBeValid(validate, { foo: 3.99 });

        shouldBeInvalid(validate, { foo: 2 });
        shouldBeInvalid(validate, { foo: 4 });
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
  });

  function shouldBeValid(validate, data) {
    validate(data) .should.equal(true);
    should.not.exist(validate.errors);
  }

  function shouldBeInvalid(validate, data, numErrors) {
    validate(data) .should.equal(false);
    validate.errors .should.have.length(numErrors || 1);
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
