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

      ajv.addSchema({
        id: '//test/fooBar2',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
        additionalProperties: { type: 'string', pattern: '^to-be-', maxLength: 10 }
      });

      var object = {
        foo: 'foo', bar: 'bar', baz: 'to-be-kept', quux: 'to-be-removed', fizz: 1000
      };

      ajv.validate('//test/fooBar2', object).should.equal(true);
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


  describe('missingRefs', function() {
    it('should throw if ref is missing without this option', function() {
      var ajv = Ajv();
      should.throw(function() {
        ajv.compile({ $ref: 'missing_reference' });
      });
    });

    it('should not throw and pass validation with missingRef == "ignore"', function() {
      testMissingRefsIgnore(Ajv({ missingRefs: 'ignore' }));
      testMissingRefsIgnore(Ajv({ missingRefs: 'ignore', allErrors: true }));

      function testMissingRefsIgnore(ajv) {
        var validate = ajv.compile({ $ref: 'missing_reference' });
        validate({}) .should.equal(true);
      }
    });

    it('should not throw and fail validation with missingRef == "fail" if the ref is used', function() {
      testMissingRefsFail(Ajv({ missingRefs: 'fail' }));
      testMissingRefsFail(Ajv({ missingRefs: 'fail', verbose: true }));
      testMissingRefsFail(Ajv({ missingRefs: 'fail', allErrors: true }));
      testMissingRefsFail(Ajv({ missingRefs: 'fail', allErrors: true, verbose: true }));

      function testMissingRefsFail(ajv) {
        var validate = ajv.compile({
          anyOf: [
            { type: 'number' },
            { $ref: 'missing_reference' }
          ]
        });
        validate(123) .should.equal(true);
        validate('foo') .should.equal(false);

        validate = ajv.compile({ $ref: 'missing_reference' });
        validate({}) .should.equal(false);
      }
    });
  });


  describe('uniqueItems', function() {
    it('should not validate uniqueItems with uniqueItems option == false', function() {
      testUniqueItems(Ajv({ uniqueItems: false }));
      testUniqueItems(Ajv({ uniqueItems: false, allErrors: true }));

      function testUniqueItems(ajv) {
        var validate = ajv.compile({ uniqueItems: true });
        validate([1,2,3]) .should.equal(true);
        validate([1,1,1]) .should.equal(true);
      }
    });
  });


  describe('unicode', function() {
    it('should use String.prototype.length with unicode option == false', function() {
      var ajvUnicode = Ajv();
      testUnicode(Ajv({ unicode: false }));
      testUnicode(Ajv({ unicode: false, allErrors: true }));

      function testUnicode(ajv) {
        var validateWithUnicode = ajvUnicode.compile({ minLength: 2 });
        var validate = ajv.compile({ minLength: 2 });

        validateWithUnicode('😀') .should.equal(false);
        validate('😀') .should.equal(true);        

        var validateWithUnicode = ajvUnicode.compile({ maxLength: 1 });
        var validate = ajv.compile({ maxLength: 1 });

        validateWithUnicode('😀') .should.equal(true);
        validate('😀') .should.equal(false);        
      }
    });
  });


  describe('verbose', function() {
    it('should add schema, parentSchema and data to errors with verbose option == true', function() {
      testVerbose(Ajv({ verbose: true }));
      testVerbose(Ajv({ verbose: true, allErrors: true }));

      function testVerbose(ajv) {
        var schema = { properties: { foo: { minimum: 5 } } };
        var validate = ajv.compile(schema);

        var data = { foo: 3 };
        validate(data) .should.equal(false);
        validate.errors .should.have.length(1);
        var err = validate.errors[0];

        should.equal(err.schema, 5);
        err.parentSchema .should.eql({ minimum: 5 });
        err.parentSchema .should.equal(schema.properties.foo); // by reference
        err.data .should.equal(3);
      }
    });
  });
});
