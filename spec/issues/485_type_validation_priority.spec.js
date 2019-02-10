'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #485, order of type validation', function() {
  it('should validate types before keywords', function() {
    var ajv = new Ajv({allErrors: true});
    var validate = ajv.compile({
      type: ['integer', 'string'],
      required: ['foo'],
      minimum: 2
    });

    validate(2) .should.equal(true);
    validate('foo') .should.equal(true);

    validate(1.5) .should.equal(false);
    checkErrors(['type', 'minimum']);

    validate({}) .should.equal(false);
    checkErrors(['type', 'required']);

    function checkErrors(expectedErrs) {
      validate.errors .should.have.length(expectedErrs.length);
      expectedErrs.forEach(function (keyword, i) {
        validate.errors[i].keyword .should.equal(keyword);
      });
    }
  });
});
