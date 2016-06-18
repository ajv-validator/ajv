'use strict';

var Ajv = require('./ajv')
  , should = require('./chai').should();


describe('issue #8: schema with shared references', function() {
  it('should be supported by addSchema', spec('addSchema'));

  it('should be supported by compile', spec('compile'));

  function spec(method) {
    return function() {
      var ajv = new Ajv();

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

      var ajv = new Ajv();

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
    ajv = new Ajv();
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
    var validate = new Ajv().compile(schema);
    validate(NaN) .should.equal(NaNisValid);
  }
});


describe('issue #204, options schemas and v5 used together', function() {
  it('should use v5 metaschemas by default', function() {
    var ajv = new Ajv({
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


describe('issue #181, custom keyword is not validated in allErrors mode if there were previous error', function() {
  it('should validate custom keyword that doesn\'t create errors', function() {
    testCustomKeywordErrors({
      type:'object',
      errors: true,
      validate: function v(value) {
        return false;
      }
    });
  });

  it('should validate custom keyword that creates errors', function() {
    testCustomKeywordErrors({
      type:'object',
      errors: true,
      validate: function v(value) {
        v.errors = v.errors || [];
        v.errors.push({
          keyword: 'alwaysFails',
          message: 'alwaysFails error',
          params: {
            keyword: 'alwaysFails'
          }
        });

        return false;
      }
    });
  });

  function testCustomKeywordErrors(def) {
    var ajv = new Ajv({ allErrors: true, beautify: true });

    ajv.addKeyword('alwaysFails', def);

    var schema = {
      required: ['foo'],
      alwaysFails: true
    };

    var validate = ajv.compile(schema);

    validate({ foo: 1 }) .should.equal(false);
    validate.errors .should.have.length(1);
    validate.errors[0].keyword .should.equal('alwaysFails');

    validate({}) .should.equal(false);
    validate.errors .should.have.length(2);
    validate.errors[0].keyword .should.equal('required');
    validate.errors[1].keyword .should.equal('alwaysFails');
  }
});


describe('issue #210, mutual recursive $refs that are schema fragments', function() {
  it('should compile and validate schema when one ref is fragment', function() {
    var ajv = new Ajv();

    ajv.addSchema({
      "id" : "foo",
      "definitions": {
        "bar": {
          "properties": {
            "baz": {
              "anyOf": [
                { "enum": [42] },
                { "$ref": "boo" }
              ]
            }
          }
        }
      }
    });

    ajv.addSchema({
      "id" : "boo",
      "type": "object",
      "required": ["quux"],
      "properties": {
        "quux": { "$ref": "foo#/definitions/bar" }
      }
    });

    var validate = ajv.compile({ "$ref": "foo#/definitions/bar" });

    validate({ baz: { quux: { baz: 42 } } }) .should.equal(true);
    validate({ baz: { quux: { baz: "foo" } } }) .should.equal(false);
  });

  it.skip('should compile and validate schema when both refs are fragments', function() {
    var ajv = new Ajv();

    ajv.addSchema({
      "id" : "foo",
      "definitions": {
        "bar": {
          "properties": {
            "baz": {
              "anyOf": [
                { "enum": [42] },
                { "$ref": "boo#/definitions/buu" }
              ]
            }
          }
        }
      }
    });

    ajv.addSchema({
      "id" : "boo",
      "definitions": {
        "buu": {
          "type": "object",
          "required": ["quux"],
          "properties": {
            "quux": { "$ref": "foo#/definitions/bar" }
          }
        }
      }
    });

    var validate = ajv.compile({ "$ref": "foo#/definitions/bar" });

    validate({ baz: { quux: { baz: 42 } } }) .should.equal(true);
    validate({ baz: { quux: { baz: "foo" } } }) .should.equal(false);
  });
});
