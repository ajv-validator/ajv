'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #955: option removeAdditional breaks custom keywords', function() {
  it('should support custom keywords with option removeAdditional', function() {
    var ajv = new Ajv({removeAdditional: 'all'});

    ajv.addKeyword('minTrimmedLength', {
      type: 'string',
      compile: function(schema) {
        return function(str) {
          return str.trim().length >= schema;
        };
      },
      metaSchema: {type: 'integer'}
    });

    var schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          minTrimmedLength: 3
        }
      },
      required: ['foo']
    };

    var validate = ajv.compile(schema);

    var data = {
      foo: '   bar   ',
      baz: ''
    };
    validate(data) .should.equal(true);
    data .should.not.have.property('baz');

    data = {
      foo: '   ba   ',
      baz: ''
    };
    validate(data) .should.equal(false);
    data .should.not.have.property('baz');
  });
});
