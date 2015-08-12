'use strict';


var Ajv = require(typeof window == 'object' ? 'ajv' : '../lib/ajv')
  , should = require('chai').should();


describe('Ajv Options', function () {
  describe('removeAdditional', function() {
    it('should remove all additional properties', function() {
      var ajv = Ajv({ removeAdditional: 'all' });

      ajv.addSchema({
        id: '//test/fooBar',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } }
      });

      var object = {
        foo: 'foo', bar: 'bar', baz: 'baz-to-be-removed'
      };

      ajv.validate('//test/fooBar', object).should.equal(true);
      object.should.have.property('foo');
      object.should.have.property('bar');
      object.should.not.have.property('baz');
    });


    it('should remove properties that would error when `additionalProperties = false`', function() {
      var ajv = Ajv({ removeAdditional: true });

      ajv.addSchema({
        id: '//test/fooBar',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
        additionalProperties: false
      });

      var object = {
        foo: 'foo', bar: 'bar', baz: 'baz-to-be-removed'
      };

      ajv.validate('//test/fooBar', object).should.equal(true);
      object.should.have.property('foo');
      object.should.have.property('bar');
      object.should.not.have.property('baz');
    });


    it('should remove properties that would error when `additionalProperties` is a schema', function() {
      var ajv = Ajv({ removeAdditional: 'failing' });

      ajv.addSchema({
        id: '//test/fooBar',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
        additionalProperties: { type: 'string' }
      });

      var object = {
        foo: 'foo', bar: 'bar', baz: 'baz-to-be-kept', fizz: 1000
      };

      ajv.validate('//test/fooBar', object).should.equal(true);
      object.should.have.property('foo');
      object.should.have.property('bar');
      object.should.have.property('baz');
      object.should.not.have.property('fizz');
    });
  });


  describe('meta and validateSchema', function() {
    it('should add draft-4 meta schema by default', function() {
      testOptionMeta(Ajv());
      testOptionMeta(Ajv({ meta: true }));

      function testOptionMeta(ajv) {
        ajv.getSchema('http://json-schema.org/draft-04/schema') .should.be.a('function');
        ajv.validateSchema({ type: 'integer' }) .should.equal(true);
        ajv.validateSchema({ type: 123 }) .should.equal(false);
        should.not.throw(function() { ajv.addSchema({ type: 'integer' }); });
        should.throw(function() { ajv.addSchema({ type: 123 }); });
      }
    });

    it('should throw if meta: false and validateSchema: true', function() {
      var ajv = Ajv({ meta: false });
      should.not.exist(ajv.getSchema('http://json-schema.org/draft-04/schema'));
      should.throw(function() { ajv.addSchema({ type: 'integer' }, 'integer') });
    });

    it('should skip schema validation with validateSchema: false', function() {
      var ajv = Ajv();
      should.throw(function() { ajv.addSchema({ type: 123 }, 'integer') });

      var ajv = Ajv({ validateSchema: false });
      should.not.throw(function() { ajv.addSchema({ type: 123 }, 'integer') });

      var ajv = Ajv({ validateSchema: false, meta: false });
      should.not.throw(function() { ajv.addSchema({ type: 123 }, 'integer') });
    });

    it('should not throw on invalid schema with validateSchema: "log"', function() {
      var logError = console.error;
      var loggedError = false;
      console.error = function() { loggedError = true; logError.apply(console, arguments); }

      var ajv = Ajv({ validateSchema: 'log' });
      should.not.throw(function() { ajv.addSchema({ type: 123 }, 'integer') });
      loggedError .should.equal(true);
      console.error = logError;

      var ajv = Ajv({ validateSchema: 'log', meta: false });
      should.throw(function() { ajv.addSchema({ type: 123 }, 'integer') });
    });

  });


  describe('schemas', function() {
    it('should add schemas from object', function() {
      var ajv = Ajv({ schemas: {
        int: { type: 'integer' },
        str: { type: 'string' }
      }});

      ajv.validate('int', 123) .should.equal(true);
      ajv.validate('int', 'foo') .should.equal(false);
      ajv.validate('str', 'foo') .should.equal(true);
      ajv.validate('str', 123) .should.equal(false);
    });

    it('should add schemas from array', function() {
      var ajv = Ajv({ schemas: [
        { id: 'int', type: 'integer' },
        { id: 'str', type: 'string' },
        { id: 'obj', properties: { int: { $ref: 'int' }, str: { $ref: 'str' } } }
      ]});

      ajv.validate('obj', { int: 123, str: 'foo' }) .should.equal(true);
      ajv.validate('obj', { int: 'foo', str: 'bar' }) .should.equal(false);
      ajv.validate('obj', { int: 123, str: 456 }) .should.equal(false);
    });
  });


  describe('formats', function() {
    it('should add formats from options', function() {
      var ajv = Ajv({ formats: {
        identifier: /^[a-z_$][a-z0-9_$]*$/i
      }});

      var validate = ajv.compile({ format: 'identifier' });
      validate('Abc1') .should.equal(true);
      validate('123') .should.equal(false);
      validate(123) .should.equal(true);
    });
  });
});
