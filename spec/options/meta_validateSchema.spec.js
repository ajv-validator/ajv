'use strict';

var Ajv = require('../ajv');
var should = require('../chai').should();


describe('meta and validateSchema options', function() {
  it('should add draft-7 meta schema by default', function() {
    testOptionMeta(new Ajv);
    testOptionMeta(new Ajv({ meta: true }));

    function testOptionMeta(ajv) {
      ajv.getSchema('http://json-schema.org/draft-07/schema') .should.be.a('function');
      ajv.validateSchema({ type: 'integer' }) .should.equal(true);
      ajv.validateSchema({ type: 123 }) .should.equal(false);
      should.not.throw(function() { ajv.addSchema({ type: 'integer' }); });
      should.throw(function() { ajv.addSchema({ type: 123 }); });
    }
  });

  it('should throw if meta: false and validateSchema: true', function() {
    var ajv = new Ajv({ meta: false });
    should.not.exist(ajv.getSchema('http://json-schema.org/draft-07/schema'));
    should.not.throw(function() { ajv.addSchema({ type: 'wrong_type' }, 'integer'); });
  });

  it('should skip schema validation with validateSchema: false', function() {
    var ajv = new Ajv;
    should.throw(function() { ajv.addSchema({ type: 123 }, 'integer'); });

    ajv = new Ajv({ validateSchema: false });
    should.not.throw(function() { ajv.addSchema({ type: 123 }, 'integer'); });

    ajv = new Ajv({ validateSchema: false, meta: false });
    should.not.throw(function() { ajv.addSchema({ type: 123 }, 'integer'); });
  });

  it('should not throw on invalid schema with validateSchema: "log"', function() {
    var logError = console.error;
    var loggedError = false;
    console.error = function() { loggedError = true; logError.apply(console, arguments); };

    var ajv = new Ajv({ validateSchema: 'log' });
    should.not.throw(function() { ajv.addSchema({ type: 123 }, 'integer'); });
    loggedError .should.equal(true);

    loggedError = false;
    ajv = new Ajv({ validateSchema: 'log', meta: false });
    should.not.throw(function() { ajv.addSchema({ type: 123 }, 'integer'); });
    loggedError .should.equal(false);
    console.error = logError;
  });

  it('should validate v6 schema', function() {
    var ajv = new Ajv;
    ajv.validateSchema({ contains: { minimum: 2 } }) .should.equal(true);
    ajv.validateSchema({ contains: 2 }). should.equal(false);
  });

  it('should use option meta as default meta schema', function() {
    var meta = {
      $schema: 'http://json-schema.org/draft-07/schema',
      properties: {
        myKeyword: { type: 'boolean' }
      }
    };
    var ajv = new Ajv({ meta: meta });
    ajv.validateSchema({ myKeyword: true }) .should.equal(true);
    ajv.validateSchema({ myKeyword: 2 }) .should.equal(false);
    ajv.validateSchema({
      $schema: 'http://json-schema.org/draft-07/schema',
      myKeyword: 2
    }) .should.equal(true);

    ajv = new Ajv;
    ajv.validateSchema({ myKeyword: true }) .should.equal(true);
    ajv.validateSchema({ myKeyword: 2 }) .should.equal(true);
  });
});
