'use strict';

var Ajv = require('../ajv');
var should = require('../chai').should();


describe('schemaId option', function() {
  describe('= "$id" (default)', function() {
    it('should use $id and ignore id', function() {
      test(new Ajv);
      test(new Ajv({schemaId: '$id'}));

      function test(ajv) {
        ajv.addSchema({ $id: 'mySchema1', type: 'string' });
        var validate = ajv.getSchema('mySchema1');
        validate('foo') .should.equal(true);
        validate(1) .should.equal(false);

        validate = ajv.compile({ id: 'mySchema2', type: 'string' });
        should.not.exist(ajv.getSchema('mySchema2'));
      }
    });
  });

  describe('= "id"', function() {
    it('should use id and ignore $id', function() {
      var ajv = new Ajv({schemaId: 'id', meta: false});
      ajv.addMetaSchema(require('../../lib/refs/json-schema-draft-04.json'));
      ajv._opts.defaultMeta = 'http://json-schema.org/draft-04/schema#';

      ajv.addSchema({ id: 'mySchema1', type: 'string' });
      var validate = ajv.getSchema('mySchema1');
      validate('foo') .should.equal(true);
      validate(1) .should.equal(false);

      validate = ajv.compile({ $id: 'mySchema2', type: 'string' });
      should.not.exist(ajv.getSchema('mySchema2'));
    });
  });

  describe('= "auto"', function() {
    it('should use both id and $id', function() {
      var ajv = new Ajv({schemaId: 'auto'});

      ajv.addSchema({ $id: 'mySchema1', type: 'string' });
      var validate = ajv.getSchema('mySchema1');
      validate('foo') .should.equal(true);
      validate(1) .should.equal(false);

      ajv.addSchema({ id: 'mySchema2', type: 'string' });
      validate = ajv.getSchema('mySchema2');
      validate('foo') .should.equal(true);
      validate(1) .should.equal(false);
    });

    it('should throw if both id and $id are available and different', function() {
      var ajv = new Ajv({schemaId: 'auto'});

      ajv.compile({
        id: 'mySchema',
        $id: 'mySchema'
      });

      should.throw(function() {
        ajv.compile({
          id: 'mySchema1',
          $id: 'mySchema2'
        });
      });
    });
  });
});
