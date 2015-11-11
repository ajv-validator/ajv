'use strict';


var Ajv = require(typeof window == 'object' ? 'ajv' : '../lib/ajv')
  , should = require('chai').should()
  , getAjvInstances = require('./ajv_instances');


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

  describe('interpreted custom rules', function() {
    it('should add and validate rule', function() {
      instances.forEach(testAddKeyword);

      function testAddKeyword(ajv) {
        ajv.addKeyword('even', { type: 'number', validate: isEven });
        var validate = ajv.compile({ even: true });
        validate(2) .should.equal(true);
        validate('abc') .should.equal(true);
        validate(2.5) .should.equal(false);
        validate(3) .should.equal(false);
      }
    });

    function isEven(schema, data) {
      if (typeof schema != 'boolean') throw new Error('The value of "even" keyword must be boolean');
      return data % 2 ? !schema : schema;
    }
  });

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
