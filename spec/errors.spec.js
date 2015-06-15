'use strict';


var Ajv = require('../lib/ajv')
  , should = require('chai').should();


describe('Validation errors', function () {
  var ajv;

  beforeEach(function() {
    ajv = Ajv();
  });

  it('error should include dataPath', function() {
    testSchema({
      properties: {
        foo: { type: 'number' }
      }
    });
  });

  it('error should include dataPath in refs', function() {
    testSchema({
      definitions: {
        num: { type: 'number' }
      },
      properties: {
        foo: { $ref: '#/definitions/num' }
      }
    });
  });


  function testSchema(schema) {
    var data = { foo: 1 }
      , invalidData = { foo: 'bar' };

    var validate = ajv.compile(schema);
    validate(data) .should.equal(true);
    should.equal(validate.errors, null);

    validate(invalidData) .should.equal(false);
    validate.errors.length .should.equal(1);

    var error = validate.errors[0];
    error.keyword .should.equal('type');
    error.message .should.be.a('string');
    error.dataPath .should.equal('.foo');
  }
});
