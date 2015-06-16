'use strict';


var Ajv = require('../lib/ajv')
  , should = require('chai').should();


describe('Validation errors', function () {
  var ajv, fullAjv;

  beforeEach(function() {
    ajv = Ajv();
    fullAjv = Ajv({ allErrors: true });
  });

  it('error should include dataPath', function() {
    testSchema1({
      properties: {
        foo: { type: 'number' }
      }
    });
  });

  it('error should include dataPath in refs', function() {
    testSchema1({
      definitions: {
        num: { type: 'number' }
      },
      properties: {
        foo: { $ref: '#/definitions/num' }
      }
    });
  });


  it('errors for additionalProperties should include property in dataPath', function() {
    var schema = {
      properties: {
        foo: {},
        bar: {}
      },
      additionalProperties: false
    };

    var data = { foo: 1, bar: 2 }
      , invalidData = { foo: 1, bar: 2, baz: 3, quux: 4 };

    var validate = ajv.compile(schema);
    shouldBeValid(validate, data);
    shouldBeInvalid(validate, invalidData);
    shouldBeError(validate.errors[0], 'additionalProperties', "['baz']");

    var fullValidate = fullAjv.compile(schema);
    shouldBeValid(fullValidate, data);
    shouldBeInvalid(fullValidate, invalidData, 2);
    shouldBeError(fullValidate.errors[0], 'additionalProperties', "['baz']");
    shouldBeError(fullValidate.errors[1], 'additionalProperties', "['quux']");
  });


  function testSchema1(schema) {
    _testSchema1(ajv, schema);
    _testSchema1(fullAjv, schema)
  }


  function _testSchema1(ajv, schema) {
    var data = { foo: 1 }
      , invalidData = { foo: 'bar' };

    var validate = ajv.compile(schema);
    shouldBeValid(validate, data);
    shouldBeInvalid(validate, invalidData);
    shouldBeError(validate.errors[0], 'type', '.foo');
  }


  function shouldBeValid(validate, data) {
    validate(data) .should.equal(true);
    should.equal(validate.errors, null);
  }


  function shouldBeInvalid(validate, data, numErrors) {
    validate(data) .should.equal(false);
    validate.errors.length .should.equal(numErrors || 1);
  }


  function shouldBeError(error, keyword, dataPath) {
    error.keyword .should.equal(keyword);
    error.message .should.be.a('string');
    error.dataPath .should.equal(dataPath);
  }
});
