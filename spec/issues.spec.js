'use strict';

var Ajv = require('./ajv')
  , should = require('./chai').should();


describe('issue #8: schema with shared references', function() {
  it('should be supported by addSchema', spec('addSchema'));

  it('should be supported by compile', spec('compile'));

  function spec(method) {
    return function() {
      var ajv = Ajv();

      var propertySchema = {
        type: 'string',
        maxLength: 4
      };

      var schema = {
        id: 'obj.json#',
        type: 'object',
        properties: {
          foo: propertySchema,
          bar: propertySchema
        }
      };

      ajv[method](schema);

      var result = ajv.validate('obj.json#', { foo: 'abc', bar: 'def' });
      result .should.equal(true);

      var result = ajv.validate('obj.json#', { foo: 'abcde', bar: 'fghg' });
      result .should.equal(false);
      ajv.errors .should.have.length(1);
    };
  }
});

describe('issue #50: references with "definitions"', function () {
  it('should be supported by addSchema', spec('addSchema'));

  it('should be supported by compile', spec('addSchema'));

  function spec(method) {
    return function() {
      var result;

      var ajv = Ajv();

      ajv[method]({
        id: 'http://example.com/test/person.json#',
        definitions: {
          name: { type: 'string' }
        },
        type: 'object',
        properties: {
          name: { $ref: '#/definitions/name'}
        }
      });

      ajv[method]({
        id: 'http://example.com/test/employee.json#',
        type: 'object',
        properties: {
          person: { $ref: '/test/person.json#' },
          role: { type: 'string' }
        }
      });

      result = ajv.validate('http://example.com/test/employee.json#', {
        person: {
          name: 'Alice'
        },
        role: 'Programmer'
      });

      result. should.equal(true);
      should.equal(ajv.errors, null);
    };
  }
});


describe('issue #182, NaN validation', function() {
  var ajv;

  before(function(){
    ajv = Ajv();
  });

  it('should not pass minimum/maximum validation', function() {
    testNaN({ minimum: 1 }, false);
    testNaN({ maximum: 1 }, false);
  });

  it('should pass type: number validation', function() {
    testNaN({ type: 'number' }, true);
  });

  it('should not pass type: integer validation', function() {
    testNaN({ type: 'integer' }, false);
  });

  function testNaN(schema, NaNisValid) {
    var validate = Ajv().compile(schema);
    validate(NaN) .should.equal(NaNisValid);
  }
});


describe('issue #204, options schemas and v5 used together', function() {
  it('should use v5 metaschemas by default', function() {
    var ajv = Ajv({
      v5: true,
      schemas: [{id: 'str', type: 'string'}],
    });

    var schema = { constant: 42 };
    var validate = ajv.compile(schema);

    validate(42) .should.equal(true);
    validate(43) .should.equal(false);

    ajv.validate('str', 'foo') .should.equal(true);
    ajv.validate('str', 42) .should.equal(false);
  });
});
