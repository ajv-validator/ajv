'use strict';


var Ajv = require(typeof window == 'object' ? 'ajv' : '../lib/ajv')
  , should = require('chai').should()
  , getAjvInstances = require('./ajv_instances')
  , equal = require('../lib/compile/equal');


describe('Custom keywords', function () {
  var ajv, instances;

  beforeEach(function() {
    ajv = Ajv();
    instances = getAjvInstances({
      allErrors:    true,
      verbose:      true,
      inlineRefs:   false,
      i18n:         true
    });
  });

  describe('custom rules', function() {
    var compileCount;

    it('should add and validate rule with "interpreted" keyword validation', function() {
      instances.forEach(testAddEvenKeyword({ type: 'number', validate: validateEven }));

      function validateEven(schema, data) {
        if (typeof schema != 'boolean') throw new Error('The value of "even" keyword must be boolean');
        return data % 2 ? !schema : schema;
      }
    });

    it('should add and validate rule with "compiled" keyword validation', function() {
      instances.forEach(testAddEvenKeyword({ type: 'number', compile: compileEven }));

      function compileEven(schema) {
        if (typeof schema != 'boolean') throw new Error('The value of "even" keyword must be boolean');
        return schema ? isEven : isOdd;
      }

      function isEven(data) { return data % 2 === 0; }
      function isOdd(data) { return data % 2 !== 0; }
    });

    it('should compile keyword validating function only once per schema', function () {
      instances.forEach(test);

      function test(ajv) {
        ajv.addKeyword('constant', { compile: compileConstant });

        var schema = { "constant": "abc" };
        compileCount = 0;
        var validate = ajv.compile(schema);
        should.equal(compileCount, 1);

        shouldBeValid(validate, 'abc');
        shouldBeInvalid(validate, 2);
        shouldBeInvalid(validate, {});
      }
    });

    it('should allow multiple schemas for the same keyword', function () {
      instances.forEach(test);

      function test(ajv) {
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
      }
    });

    function compileConstant(schema) {
      compileCount++;
      return typeof schema == 'object' && schema !== null
              ? isDeepEqual
              : isStrictEqual;

      function isDeepEqual(data) { return equal(data, schema); }
      function isStrictEqual(data) { return data === schema; }
    }

    function testAddEvenKeyword(definition) {
      return function (ajv) {
        ajv.addKeyword('even', definition);
        var schema = { "even": true };
        var validate = ajv.compile(schema);

        shouldBeValid(validate, 2);
        shouldBeValid(validate, 'abc');
        shouldBeInvalid(validate, 2.5);
        shouldBeInvalid(validate, 3);
      };
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
        addKeyword('custom3', ['number', 'wrongtype']);
      });

      should.throw(function() {
        addKeyword('custom4', ['number', undefined]);
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
