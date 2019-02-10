'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #181, custom keyword is not validated in allErrors mode if there were previous error', function() {
  it('should validate custom keyword that doesn\'t create errors', function() {
    testCustomKeywordErrors({
      type:'object',
      errors: true,
      validate: function v(/* value */) {
        return false;
      }
    });
  });

  it('should validate custom keyword that creates errors', function() {
    testCustomKeywordErrors({
      type:'object',
      errors: true,
      validate: function v(/* value */) {
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
    var ajv = new Ajv({ allErrors: true });

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
