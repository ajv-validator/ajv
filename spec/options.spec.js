'use strict';


var Ajv = require('./ajv')
  , getAjvInstances = require('./ajv_instances')
  , should = require('./chai').should()


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

    it('should validate v5 schema', function() {
      var ajv = Ajv({ v5: true });
      ajv.validateSchema({ contains: { minimum: 2 } }) .should.equal(true);
      ajv.validateSchema({ contains: 2 }). should.equal(false);

      var ajv = Ajv();
      ajv.validateSchema({ contains: 2 }). should.equal(true);
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


  describe('format', function() {
    it('should not validate formats if option format == false', function() {
      var ajv = Ajv()
        , ajvFF = Ajv({ format: false });

      var schema = { format: 'date-time' };
      var invalideDateTime = '06/19/1963 08:30:06 PST';

      ajv.validate(schema, invalideDateTime) .should.equal(false);
      ajvFF.validate(schema, invalideDateTime) .should.equal(true);
    });

    it('should not validate formatMaximum/Minimum if option format == false', function() {
      var ajv = Ajv({ v5: true, allErrors: true })
        , ajvFF = Ajv({ v5: true, allErrors: true, format: false });

      var schema = {
        format: 'date',
        formatMaximum: '2015-08-01'
      };

      var date = '2015-09-01';
      ajv.validate(schema, date) .should.equal(false);
      ajvFF.validate(schema, date) .should.equal(true);
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
        should.equal(err.data, 3);
      }
    });
  });


  describe('multipleOfPrecision', function() {
    it('should allow for some deviation from 0 when validating multipleOf with value < 1', function() {
      test(Ajv({ multipleOfPrecision: 7 }));
      test(Ajv({ multipleOfPrecision: 7, allErrors: true }));

      function test(ajv) {
        var schema = { multipleOf: 0.01 };
        var validate = ajv.compile(schema);

        validate(4.18) .should.equal(true);
        validate(4.181) .should.equal(false);

        var schema = { multipleOf: 0.0000001 };
        var validate = ajv.compile(schema);

        validate(53.198098) .should.equal(true);
        validate(53.1980981) .should.equal(true);
        validate(53.19809811) .should.equal(false);
      }
    });
  });


  describe('useDefaults', function() {
    it('should replace undefined property with default value', function() {
      var instances = getAjvInstances({
        allErrors: true,
        loopRequired: 3
      }, { useDefaults: true });

      instances.forEach(test);


      function test(ajv) {
        var schema = {
          properties: {
            foo: { type: 'string', default: 'abc' },
            bar: { type: 'number', default: 1 },
            baz: { type: 'boolean', default: false },
            nil: { type: 'null', default: null },
            obj: { type: 'object', default: {} },
            arr: { type: 'array', default: [] }
          },
          required: ['foo', 'bar', 'baz', 'nil', 'obj', 'arr'],
          minProperties: 6
        };

        var validate = ajv.compile(schema);

        var data = {};
        validate(data) .should.equal(true);
        data. should.eql({ foo: 'abc', bar: 1, baz: false, nil: null, obj: {}, arr:[] });

        var data = { foo: 'foo', bar: 2, obj: { test: true } };
        validate(data) .should.equal(true);
        data. should.eql({ foo: 'foo', bar: 2, baz: false, nil: null, obj: { test: true }, arr:[] });
      }
    });

    it('should replace undefined item with default value', function() {
      test(Ajv({ useDefaults: true }));
      test(Ajv({ useDefaults: true, allErrors: true }));

      function test(ajv) {
        var schema = {
          items: [
            { type: 'string', default: 'abc' },
            { type: 'number', default: 1 },
            { type: 'boolean', default: false }
          ],
          minItems: 3
        };

        var validate = ajv.compile(schema);

        var data = [];
        validate(data) .should.equal(true);
        data. should.eql([ 'abc', 1, false ]);

        var data = [ 'foo' ];
        validate(data) .should.equal(true);
        data. should.eql([ 'foo', 1, false ]);

        var data = ['foo', 2,'false'];
        validate(data) .should.equal(false);
        validate.errors .should.have.length(1);
        data. should.eql([ 'foo', 2, 'false' ]);
      }
    });
  });


  describe('addUsedSchema', function() {
    [true, undefined].forEach(function (optionValue) {
      describe('= ' + optionValue, function() {
        var ajv;

        beforeEach(function() {
          ajv = Ajv({ addUsedSchema: optionValue });
        });

        describe('compile and validate', function() {
          it('should add schema', function() {
            var schema = { id: 'str', type: 'string' };
            var validate = ajv.compile(schema);
            validate('abc') .should.equal(true);
            validate(1) .should.equal(false);
            ajv.getSchema('str') .should.equal(validate);

            var schema = { id: 'int', type: 'integer' };
            ajv.validate(schema, 1) .should.equal(true);
            ajv.validate(schema, 'abc') .should.equal(false);
            ajv.getSchema('int') .should.be.a('function');
          });

          it('should throw with duplicate ID', function() {
            ajv.compile({ id: 'str', type: 'string' });
            should.throw(function() {
              ajv.compile({ id: 'str', minLength: 2 });
            });

            var schema = { id: 'int', type: 'integer' };
            var schema2 = { id: 'int', minimum: 0 };
            ajv.validate(schema, 1) .should.equal(true);
            should.throw(function() {
              ajv.validate(schema2, 1);
            });
          });
        });
      });
    });

    describe('= false', function() {
      var ajv;

      beforeEach(function() {
        ajv = Ajv({ addUsedSchema: false });
      });


      describe('compile and validate', function() {
        it('should NOT add schema', function() {
          var schema = { id: 'str', type: 'string' };
          var validate = ajv.compile(schema);
          validate('abc') .should.equal(true);
          validate(1) .should.equal(false);
          should.equal(ajv.getSchema('str'), undefined);

          var schema = { id: 'int', type: 'integer' };
          ajv.validate(schema, 1) .should.equal(true);
          ajv.validate(schema, 'abc') .should.equal(false);
          should.equal(ajv.getSchema('int'), undefined);
        });

        it('should NOT throw with duplicate ID', function() {
          ajv.compile({ id: 'str', type: 'string' });
          should.not.throw(function() {
            ajv.compile({ id: 'str', minLength: 2 });
          });

          var schema = { id: 'int', type: 'integer' };
          var schema2 = { id: 'int', minimum: 0 };
          ajv.validate(schema, 1) .should.equal(true);
          should.not.throw(function() {
            ajv.validate(schema2, 1) .should.equal(true);
          });
        });
      });
    });
  });


  describe('passContext', function() {
    var ajv, contexts;

    beforeEach(function() {
      contexts = [];
    })

    describe('= true', function() {
      it('should pass this value as context to custom keyword validation function', function() {
        var validate = getValidate(true);
        var self = {};
        validate.call(self, {});
        contexts .should.have.length(4);
        contexts.forEach(function(ctx) {
          ctx .should.equal(self);
        });
      });
    });

    describe('= false', function() {
      it('should pass ajv instance as context to custom keyword validation function', function() {
        var validate = getValidate(false);
        var self = {};
        validate.call(self, {});
        contexts .should.have.length(4);
        contexts.forEach(function(ctx) {
          ctx .should.equal(ajv);
        });
      });
    })

    function getValidate(passContext) {
      ajv = Ajv({ passContext: passContext, inlineRefs: false });
      ajv.addKeyword('testValidate', { validate: storeContext });
      ajv.addKeyword('testCompile', { compile: compileTestValidate });

      var schema = {
        definitions: {
          test1: {
            testValidate: true,
            testCompile: true,
          },
          test2: {
            allOf: [ { $ref: '#/definitions/test1' } ]
          }
        },
        allOf: [
          { $ref: '#/definitions/test1' },
          { $ref: '#/definitions/test2' }
        ]
      };

      return ajv.compile(schema);
    }

    function storeContext() {
      contexts.push(this);
      return true;
    }

    function compileTestValidate() {
      return storeContext;
    }
  });


  describe('allErrors', function() {
    it('should be disabled inside "not" keyword', function() {
      test(Ajv(), false);
      test(Ajv({ allErrors: true }), true);

      function test(ajv, allErrors) {
        var format1called = false
          , format2called = false;

        ajv.addFormat('format1', function() {
          format1called = true;
          return false;
        });

        ajv.addFormat('format2', function() {
          format2called = true;
          return false;
        });

        var schema1 = {
          allOf: [
            { format: 'format1' },
            { format: 'format2' }
          ]
        };

        ajv.validate(schema1, 'abc') .should.equal(false);
        ajv.errors .should.have.length(allErrors ? 2 : 1);
        format1called .should.equal(true);
        format2called .should.equal(allErrors);

        var schema2 = {
          not: schema1
        };

        format1called = format2called = false;
        ajv.validate(schema2, 'abc') .should.equal(true);
        should.equal(ajv.errors, null);
        format1called .should.equal(true);
        format2called .should.equal(false);
      }
    });
  });
});
