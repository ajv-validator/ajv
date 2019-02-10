'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #204, options schemas and $data used together', function() {
  it('should use v5 metaschemas by default', function() {
    var ajv = new Ajv({
      schemas: [{$id: 'str', type: 'string'}],
      $data: true
    });

    var schema = { const: 42 };
    var validate = ajv.compile(schema);

    validate(42) .should.equal(true);
    validate(43) .should.equal(false);

    ajv.validate('str', 'foo') .should.equal(true);
    ajv.validate('str', 42) .should.equal(false);
  });
});
