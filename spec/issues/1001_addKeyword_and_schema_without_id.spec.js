'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #1001: addKeyword breaks schema without ID', function() {
  it('should allow using schemas without ID with addKeyword', function() {
    var schema = {
      definitions: {
        foo: {}
      }
    };

    var ajv = new Ajv();
    ajv.addSchema(schema);
    ajv.addKeyword('myKeyword', {});
    ajv.getSchema('#/definitions/foo') .should.be.a('function');
  });
});
