'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #182, NaN validation', function() {
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
    var ajv = new Ajv;
    var validate = ajv.compile(schema);
    validate(NaN) .should.equal(NaNisValid);
  }
});
