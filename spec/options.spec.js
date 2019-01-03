'use strict';

var Ajv = require('./ajv')
  , getAjvInstances = require('./ajv_instances')
  , should = require('./chai').should();


describe('Ajv Options', function () {
  describe('removeAdditional', function() {
    it('should remove all additional properties', function() {
      var ajv = new Ajv({ removeAdditional: 'all' });

      ajv.addSchema({
        $id: '//test/fooBar',
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
      var ajv = new Ajv({ removeAdditional: true });

      ajv.addSchema({
        $id: '//test/fooBar',
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


    it('should remove properties that would error when `additionalProperties = false` (many properties, boolean schema)', function() {
      var ajv = new Ajv({removeAdditional: true});

      var schema = {
        properties: {
          obj: {
            additionalProperties: false,
            properties: {
              a: { type: 'string' },
              b: false,
              c: { type: 'string' },
              d: { type: 'string' },
              e: { type: 'string' },
              f: { type: 'string' },
              g: { type: 'string' },
              h: { type: 'string' },
              i: { type: 'string' }
            }
          }
        }
      };

      var data = {
        obj: {
          a: 'valid',
          b: 'should not be removed',
          additional: 'will be removed'
        }
      };

      ajv.validate(schema, data) .should.equal(false);
      data .should.eql({
        obj: {
          a: 'valid',
          b: 'should not be removed'
        }
      });
    });


    it('should remove properties that would error when `additionalProperties` is a schema', function() {
      var ajv = new Ajv({ removeAdditional: 'failing' });

      ajv.addSchema({
        $id: '//test/fooBar',
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
        $id: '//test/fooBar2',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
        additionalProperties: { type: 'string', pattern: '^to-be-', maxLength: 10 }
      });

      object = {
        foo: 'foo', bar: 'bar', baz: 'to-be-kept', quux: 'to-be-removed', fizz: 1000
      };

      ajv.validate('//test/fooBar2', object).should.equal(true);
      object.should.have.property('foo');
      object.should.have.property('bar');
      object.should.have.property('baz');
      object.should.not.have.property('fizz');
    });
  });


  describe('ownProperties', function() {
    var ajv, ajvOP, ajvOP1;

    beforeEach(function() {
      ajv = new Ajv({ allErrors: true });
      ajvOP = new Ajv({ ownProperties: true, allErrors: true });
      ajvOP1 = new Ajv({ ownProperties: true });
    });

    it('should only validate own properties with additionalProperties', function() {
      var schema = {
        properties: { a: { type: 'number' } },
        additionalProperties: false
      };

      var obj = { a: 1 };
      var proto = { b: 2 };
      test(schema, obj, proto);
    });

    it('should only validate own properties with properties keyword', function() {
      var schema = {
        properties: {
          a: { type: 'number' },
          b: { type: 'number' }
        }
      };

      var obj = { a: 1 };
      var proto = { b: 'not a number' };
      test(schema, obj, proto);
    });

    it('should only validate own properties with required keyword', function() {
      var schema = {
        required: ['a', 'b']
      };

      var obj = { a: 1 };
      var proto = { b: 2 };
      test(schema, obj, proto, 1, true);
    });

    it('should only validate own properties with required keyword - many properties', function() {
      ajv = new Ajv({ allErrors: true, loopRequired: 1 });
      ajvOP = new Ajv({ ownProperties: true, allErrors: true, loopRequired: 1 });
      ajvOP1 = new Ajv({ ownProperties: true, loopRequired: 1 });

      var schema = {
        required: ['a', 'b', 'c', 'd']
      };

      var obj = { a: 1, b: 2 };
      var proto = { c: 3, d: 4 };
      test(schema, obj, proto, 2, true);
    });

    it('should only validate own properties with required keyword as $data', function() {
      ajv = new Ajv({ allErrors: true, $data: true });
      ajvOP = new Ajv({ ownProperties: true, allErrors: true, $data: true });
      ajvOP1 = new Ajv({ ownProperties: true, $data: true });

      var schema = {
        required: { $data: '0/req' },
        properties: {
          req: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      };

      var obj = {
        req: ['a', 'b'],
        a: 1
      };
      var proto = { b: 2 };
      test(schema, obj, proto, 1, true);
    });

    it('should only validate own properties with properties and required keyword', function() {
      var schema = {
        properties: {
          a: { type: 'number' },
          b: { type: 'number' }
        },
        required: ['a', 'b']
      };

      var obj = { a: 1 };
      var proto = { b: 2 };
      test(schema, obj, proto, 1, true);
    });

    it('should only validate own properties with dependencies keyword', function() {
      var schema = {
        dependencies: {
          a: ['c'],
          b: ['d']
        }
      };

      var obj = { a: 1, c: 3 };
      var proto = { b: 2 };
      test(schema, obj, proto);

      obj = { a: 1, b: 2, c: 3 };
      proto = { d: 4 };
      test(schema, obj, proto, 1, true);
    });

    it('should only validate own properties with schema dependencies', function() {
      var schema = {
        dependencies: {
          a: { not: { required: ['c'] } },
          b: { not: { required: ['d'] } }
        }
      };

      var obj = { a: 1, d: 3 };
      var proto = { b: 2 };
      test(schema, obj, proto);

      obj = { a: 1, b: 2 };
      proto = { d: 4 };
      test(schema, obj, proto);
    });

    it('should only validate own properties with patternProperties', function() {
      var schema = {
        patternProperties: { 'f.*o': { type: 'integer' } },
      };

      var obj = { fooo: 1 };
      var proto = { foo: 'not a number' };
      test(schema, obj, proto);
    });

    it('should only validate own properties with propertyNames', function() {
      var schema = {
        propertyNames: {
          format: 'email'
        }
      };

      var obj = { 'e@example.com': 2 };
      var proto = { 'not email': 1 };
      test(schema, obj, proto, 2);
    });

    function test(schema, obj, proto, errors, reverse) {
      errors = errors || 1;
      var validate = ajv.compile(schema);
      var validateOP = ajvOP.compile(schema);
      var validateOP1 = ajvOP1.compile(schema);
      var data = Object.create(proto);
      for (var key in obj) data[key] = obj[key];

      if (reverse) {
        validate(data) .should.equal(true);
        validateOP(data) .should.equal(false);
        validateOP.errors .should.have.length(errors);
        validateOP1(data) .should.equal(false);
        validateOP1.errors .should.have.length(1);
      } else {
        validate(data) .should.equal(false);
        validate.errors .should.have.length(errors);
        validateOP(data) .should.equal(true);
        validateOP1(data) .should.equal(true);
      }
    }
  });

  describe('meta and validateSchema', function() {
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


  describe('schemas', function() {
    it('should add schemas from object', function() {
      var ajv = new Ajv({ schemas: {
        int: { type: 'integer' },
        str: { type: 'string' }
      }});

      ajv.validate('int', 123) .should.equal(true);
      ajv.validate('int', 'foo') .should.equal(false);
      ajv.validate('str', 'foo') .should.equal(true);
      ajv.validate('str', 123) .should.equal(false);
    });

    it('should add schemas from array', function() {
      var ajv = new Ajv({ schemas: [
        { $id: 'int', type: 'integer' },
        { $id: 'str', type: 'string' },
        { $id: 'obj', properties: { int: { $ref: 'int' }, str: { $ref: 'str' } } }
      ]});

      ajv.validate('obj', { int: 123, str: 'foo' }) .should.equal(true);
      ajv.validate('obj', { int: 'foo', str: 'bar' }) .should.equal(false);
      ajv.validate('obj', { int: 123, str: 456 }) .should.equal(false);
    });
  });


  describe('format', function() {
    it('should not validate formats if option format == false', function() {
      var ajv = new Ajv
        , ajvFF = new Ajv({ format: false });

      var schema = { format: 'date-time' };
      var invalideDateTime = '06/19/1963 08:30:06 PST';

      ajv.validate(schema, invalideDateTime) .should.equal(false);
      ajvFF.validate(schema, invalideDateTime) .should.equal(true);
    });
  });


  describe('formats', function() {
    it('should add formats from options', function() {
      var ajv = new Ajv({ formats: {
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
      var ajv = new Ajv;
      should.throw(function() {
        ajv.compile({ $ref: 'missing_reference' });
      });
    });

    it('should not throw and pass validation with missingRef == "ignore"', function() {
      testMissingRefsIgnore(new Ajv({ missingRefs: 'ignore' }));
      testMissingRefsIgnore(new Ajv({ missingRefs: 'ignore', allErrors: true }));

      function testMissingRefsIgnore(ajv) {
        var validate = ajv.compile({ $ref: 'missing_reference' });
        validate({}) .should.equal(true);
      }
    });

    it('should not throw and fail validation with missingRef == "fail" if the ref is used', function() {
      testMissingRefsFail(new Ajv({ missingRefs: 'fail' }));
      testMissingRefsFail(new Ajv({ missingRefs: 'fail', verbose: true }));
      testMissingRefsFail(new Ajv({ missingRefs: 'fail', allErrors: true }));
      testMissingRefsFail(new Ajv({ missingRefs: 'fail', allErrors: true, verbose: true }));

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
      testUniqueItems(new Ajv({ uniqueItems: false }));
      testUniqueItems(new Ajv({ uniqueItems: false, allErrors: true }));

      function testUniqueItems(ajv) {
        var validate = ajv.compile({ uniqueItems: true });
        validate([1,2,3]) .should.equal(true);
        validate([1,1,1]) .should.equal(true);
      }
    });
  });


  describe('unicode', function() {
    it('should use String.prototype.length with unicode option == false', function() {
      var ajvUnicode = new Ajv;
      testUnicode(new Ajv({ unicode: false }));
      testUnicode(new Ajv({ unicode: false, allErrors: true }));

      function testUnicode(ajv) {
        var validateWithUnicode = ajvUnicode.compile({ minLength: 2 });
        var validate = ajv.compile({ minLength: 2 });

        validateWithUnicode('😀') .should.equal(false);
        validate('😀') .should.equal(true);

        validateWithUnicode = ajvUnicode.compile({ maxLength: 1 });
        validate = ajv.compile({ maxLength: 1 });

        validateWithUnicode('😀') .should.equal(true);
        validate('😀') .should.equal(false);
      }
    });
  });


  describe('verbose', function() {
    it('should add schema, parentSchema and data to errors with verbose option == true', function() {
      testVerbose(new Ajv({ verbose: true }));
      testVerbose(new Ajv({ verbose: true, allErrors: true }));

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
      test(new Ajv({ multipleOfPrecision: 7 }));
      test(new Ajv({ multipleOfPrecision: 7, allErrors: true }));

      function test(ajv) {
        var schema = { multipleOf: 0.01 };
        var validate = ajv.compile(schema);

        validate(4.18) .should.equal(true);
        validate(4.181) .should.equal(false);

        schema = { multipleOf: 0.0000001 };
        validate = ajv.compile(schema);

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
        data .should.eql({ foo: 'abc', bar: 1, baz: false, nil: null, obj: {}, arr:[] });

        data = { foo: 'foo', bar: 2, obj: { test: true } };
        validate(data) .should.equal(true);
        data .should.eql({ foo: 'foo', bar: 2, baz: false, nil: null, obj: { test: true }, arr:[] });
      }
    });

    it('should replace undefined item with default value', function() {
      test(new Ajv({ useDefaults: true }));
      test(new Ajv({ useDefaults: true, allErrors: true }));

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
        data .should.eql([ 'abc', 1, false ]);

        data = [ 'foo' ];
        validate(data) .should.equal(true);
        data .should.eql([ 'foo', 1, false ]);

        data = ['foo', 2,'false'];
        validate(data) .should.equal(false);
        validate.errors .should.have.length(1);
        data .should.eql([ 'foo', 2, 'false' ]);
      }
    });

    it('should apply default in "then" subschema (issue #635)', function() {
      test(new Ajv({ useDefaults: true }));
      test(new Ajv({ useDefaults: true, allErrors: true }));

      function test(ajv) {
        var schema = {
          if: { required: ['foo'] },
          then: {
            properties: {
              bar: { default: 2 }
            }
          },
          else: {
            properties: {
              foo: { default: 1 }
            }
          }
        };

        var validate = ajv.compile(schema);

        var data = {};
        validate(data) .should.equal(true);
        data .should.eql({foo: 1});

        data = {foo: 1};
        validate(data) .should.equal(true);
        data .should.eql({foo: 1, bar: 2});
      }
    });


    describe('useDefaults: by value / by reference', function() {
      describe('using by value', function() {
        it('should NOT modify underlying defaults when modifying validated data', function() {
          test('value', new Ajv({ useDefaults: true }));
          test('value', new Ajv({ useDefaults: true, allErrors: true }));
        });
      });

      describe('using by reference', function() {
        it('should modify underlying defaults when modifying validated data', function() {
          test('reference', new Ajv({ useDefaults: 'shared' }));
          test('reference', new Ajv({ useDefaults: 'shared', allErrors: true }));
        });
      });

      function test(useDefaultsMode, ajv) {
        var schema = {
          properties: {
            items: {
              type: 'array',
              default: ['a-default']
            }
          }
        };

        var validate = ajv.compile(schema);

        var data = {};
        validate(data) .should.equal(true);
        data.items .should.eql([ 'a-default' ]);

        data.items.push('another-value');
        data.items .should.eql([ 'a-default', 'another-value' ]);

        var data2 = {};
        validate(data2) .should.equal(true);

        if (useDefaultsMode == 'reference')
          data2.items .should.eql([ 'a-default', 'another-value' ]);
        else if (useDefaultsMode == 'value')
          data2.items .should.eql([ 'a-default' ]);
        else
          throw new Error('unknown useDefaults mode');
      }
    });


    describe('defaults with "empty" values', function() {
      var schema, data;

      beforeEach(function() {
        schema = {
          properties: {
            obj: {
              properties: {
                str: {default: 'foo'},
                n1: {default: 1},
                n2: {default: 2},
                n3: {default: 3}
              }
            },
            arr: {
              items: [
                {default: 'foo'},
                {default: 1},
                {default: 2},
                {default: 3}
              ]
            }
          }
        };

        data = {
          obj: {
            str: '',
            n1: null,
            n2: undefined
          },
          arr: ['', null, undefined]
        };
      });

      it('should NOT assign defaults when useDefaults is true/"shared"', function() {
        test(new Ajv({useDefaults: true}));
        test(new Ajv({useDefaults: 'shared'}));

        function test(ajv) {
          var validate = ajv.compile(schema);
          validate(data) .should.equal(true);
          data .should.eql({
            obj: {
              str: '',
              n1: null,
              n2: 2,
              n3: 3
            },
            arr: ['', null, 2, 3]
          });
        }
      });

      it.skip('should assign defaults when useDefaults = "empty"', function() {
        var ajv = new Ajv({useDefaults: 'empty'});
        var validate = ajv.compile(schema);
        validate(data) .should.equal(true);
        data .should.eql({
          obj: {
            str: 'foo',
            n1: 1,
            n2: 2,
            n3: 3
          },
          arr: ['foo', 1, 2, 3]
        });
      });
    });
  });


  describe('addUsedSchema', function() {
    [true, undefined].forEach(function (optionValue) {
      describe('= ' + optionValue, function() {
        var ajv;

        beforeEach(function() {
          ajv = new Ajv({ addUsedSchema: optionValue });
        });

        describe('compile and validate', function() {
          it('should add schema', function() {
            var schema = { $id: 'str', type: 'string' };
            var validate = ajv.compile(schema);
            validate('abc') .should.equal(true);
            validate(1) .should.equal(false);
            ajv.getSchema('str') .should.equal(validate);

            schema = { $id: 'int', type: 'integer' };
            ajv.validate(schema, 1) .should.equal(true);
            ajv.validate(schema, 'abc') .should.equal(false);
            ajv.getSchema('int') .should.be.a('function');
          });

          it('should throw with duplicate ID', function() {
            ajv.compile({ $id: 'str', type: 'string' });
            should.throw(function() {
              ajv.compile({ $id: 'str', minLength: 2 });
            });

            var schema = { $id: 'int', type: 'integer' };
            var schema2 = { $id: 'int', minimum: 0 };
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
        ajv = new Ajv({ addUsedSchema: false });
      });


      describe('compile and validate', function() {
        it('should NOT add schema', function() {
          var schema = { $id: 'str', type: 'string' };
          var validate = ajv.compile(schema);
          validate('abc') .should.equal(true);
          validate(1) .should.equal(false);
          should.equal(ajv.getSchema('str'), undefined);

          schema = { $id: 'int', type: 'integer' };
          ajv.validate(schema, 1) .should.equal(true);
          ajv.validate(schema, 'abc') .should.equal(false);
          should.equal(ajv.getSchema('int'), undefined);
        });

        it('should NOT throw with duplicate ID', function() {
          ajv.compile({ $id: 'str', type: 'string' });
          should.not.throw(function() {
            ajv.compile({ $id: 'str', minLength: 2 });
          });

          var schema = { $id: 'int', type: 'integer' };
          var schema2 = { $id: 'int', minimum: 0 };
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
    });

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
    });

    function getValidate(passContext) {
      ajv = new Ajv({ passContext: passContext, inlineRefs: false });
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
      test(new Ajv, false);
      test(new Ajv({ allErrors: true }), true);

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


  describe('extendRefs', function() {
    describe('= true', function() {
      it('should allow extending $ref with other keywords', function() {
        test(new Ajv({ extendRefs: true }), true);
      });

      it('should NOT log warning if extendRefs is true', function() {
        testWarning(new Ajv({ extendRefs: true }));
      });
    });

    describe('= "ignore" and default', function() {
      it('should ignore other keywords when $ref is used', function() {
        test(new Ajv);
        test(new Ajv({ extendRefs: 'ignore' }), false);
      });

      it('should log warning when other keywords are used with $ref', function() {
        testWarning(new Ajv, /keywords\signored/);
        testWarning(new Ajv({ extendRefs: 'ignore' }), /keywords\signored/);
      });
    });

    describe('= "fail"', function() {
      it('should fail schema compilation if other keywords are used with $ref', function() {
        testFail(new Ajv({ extendRefs: 'fail' }));

        function testFail(ajv) {
          should.throw(function() {
            var schema = {
              "definitions": {
                "int": { "type": "integer" }
              },
              "$ref": "#/definitions/int",
              "minimum": 10
            };
            ajv.compile(schema);
          });

          should.not.throw(function() {
            var schema = {
              "definitions": {
                "int": { "type": "integer" }
              },
              "allOf": [
                { "$ref": "#/definitions/int" },
                { "minimum": 10 }
              ]
            };
            ajv.compile(schema);
          });
        }
      });
    });

    function test(ajv, shouldExtendRef) {
      var schema = {
        "definitions": {
          "int": { "type": "integer" }
        },
        "$ref": "#/definitions/int",
        "minimum": 10
      };

      var validate = ajv.compile(schema);
      validate(10) .should.equal(true);
      validate(1) .should.equal(!shouldExtendRef);

      schema = {
        "definitions": {
          "int": { "type": "integer" }
        },
        "type": "object",
        "properties": {
          "foo": {
            "$ref": "#/definitions/int",
            "minimum": 10
          },
          "bar": {
            "allOf": [
              { "$ref": "#/definitions/int" },
              { "minimum": 10 }
            ]
          }
        }
      };

      validate = ajv.compile(schema);
      validate({ foo: 10, bar: 10 }) .should.equal(true);
      validate({ foo: 1, bar: 10 }) .should.equal(!shouldExtendRef);
      validate({ foo: 10, bar: 1 }) .should.equal(false);
    }

    function testWarning(ajv, msgPattern) {
      var oldConsole;
      try {
        oldConsole = console.warn;
        var consoleMsg;
        console.warn = function() {
          consoleMsg = Array.prototype.join.call(arguments, ' ');
        };

        var schema = {
          "definitions": {
            "int": { "type": "integer" }
          },
          "$ref": "#/definitions/int",
          "minimum": 10
        };

        ajv.compile(schema);
        if (msgPattern) consoleMsg .should.match(msgPattern);
        else should.not.exist(consoleMsg);
      } finally {
        console.warn = oldConsole;
      }
    }
  });


  describe('sourceCode', function() {
    describe('= true', function() {
      it('should add source.code property', function() {
        test(new Ajv({sourceCode: true}));

        function test(ajv) {
          var validate = ajv.compile({ "type": "number" });
          validate.source.code .should.be.a('string');
        }
      });
    });

    describe('= false and default', function() {
      it('should not add source and sourceCode properties', function() {
        test(new Ajv);
        test(new Ajv({sourceCode: false}));

        function test(ajv) {
          var validate = ajv.compile({ "type": "number" });
          should.not.exist(validate.source);
          should.not.exist(validate.sourceCode);
        }
      });
    });
  });


  describe('unknownFormats', function() {
    describe('= true (default)', function() {
      it('should fail schema compilation if unknown format is used', function() {
        test(new Ajv);
        test(new Ajv({unknownFormats: true}));

        function test(ajv) {
          should.throw(function() {
            ajv.compile({ format: 'unknown' });
          });
        }
      });

      it('should fail validation if unknown format is used via $data', function() {
        test(new Ajv({$data: true}));
        test(new Ajv({$data: true, unknownFormats: true}));

        function test(ajv) {
          var validate = ajv.compile({
            properties: {
              foo: { format: { $data: '1/bar' } },
              bar: { type: 'string' }
            }
          });

          validate({foo: 1, bar: 'unknown'}) .should.equal(false);
          validate({foo: '2016-10-16', bar: 'date'}) .should.equal(true);
          validate({foo: '20161016', bar: 'date'}) .should.equal(false);
          validate({foo: '20161016'}) .should.equal(true);

          validate({foo: '2016-10-16', bar: 'unknown'}) .should.equal(false);
        }
      });
    });

    describe('= "ignore (default before 5.0.0)"', function() {
      it('should pass schema compilation and be valid if unknown format is used', function() {
        test(new Ajv({unknownFormats: 'ignore'}));

        function test(ajv) {
          var validate = ajv.compile({ format: 'unknown' });
          validate('anything') .should.equal(true);
        }
      });

      it('should be valid if unknown format is used via $data', function() {
        test(new Ajv({$data: true, unknownFormats: 'ignore'}));

        function test(ajv) {
          var validate = ajv.compile({
            properties: {
              foo: { format: { $data: '1/bar' } },
              bar: { type: 'string' }
            }
          });

          validate({foo: 1, bar: 'unknown'}) .should.equal(true);
          validate({foo: '2016-10-16', bar: 'date'}) .should.equal(true);
          validate({foo: '20161016', bar: 'date'}) .should.equal(false);
          validate({foo: '20161016'}) .should.equal(true);
          validate({foo: '2016-10-16', bar: 'unknown'}) .should.equal(true);
        }
      });
    });

    describe('= [String]', function() {
      it('should pass schema compilation and be valid if whitelisted unknown format is used', function() {
        test(new Ajv({unknownFormats: ['allowed']}));

        function test(ajv) {
          var validate = ajv.compile({ format: 'allowed' });
          validate('anything') .should.equal(true);

          should.throw(function() {
            ajv.compile({ format: 'unknown' });
          });
        }
      });

      it('should be valid if whitelisted unknown format is used via $data', function() {
        test(new Ajv({$data: true, unknownFormats: ['allowed']}));

        function test(ajv) {
          var validate = ajv.compile({
            properties: {
              foo: { format: { $data: '1/bar' } },
              bar: { type: 'string' }
            }
          });

          validate({foo: 1, bar: 'allowed'}) .should.equal(true);
          validate({foo: 1, bar: 'unknown'}) .should.equal(false);
          validate({foo: '2016-10-16', bar: 'date'}) .should.equal(true);
          validate({foo: '20161016', bar: 'date'}) .should.equal(false);
          validate({foo: '20161016'}) .should.equal(true);

          validate({foo: '2016-10-16', bar: 'allowed'}) .should.equal(true);
          validate({foo: '2016-10-16', bar: 'unknown'}) .should.equal(false);
        }
      });
    });
  });


  describe('processCode', function() {
    it('should process generated code', function() {
      var ajv = new Ajv;
      var validate = ajv.compile({type: 'string'});
      validate.toString().split('\n').length .should.equal(1);

      var beautify = require('js-beautify').js_beautify;
      var ajvPC = new Ajv({processCode: beautify});
      validate = ajvPC.compile({type: 'string'});
      validate.toString().split('\n').length .should.be.above(1);
      validate('foo') .should.equal(true);
      validate(1) .should.equal(false);
    });
  });


  describe('serialize', function() {
    var serializeCalled;

    it('should use custom function to serialize schema to string', function() {
      serializeCalled = undefined;
      var ajv = new Ajv({ serialize: serialize });
      ajv.addSchema({ type: 'string' });
      should.equal(serializeCalled, true);
    });

    function serialize(schema) {
      serializeCalled = true;
      return JSON.stringify(schema);
    }
  });


  describe('schemaId', function() {
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
        ajv.addMetaSchema(require('../lib/refs/json-schema-draft-04.json'));
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


  describe('$comment', function() {
    describe('= true', function() {
      var logCalls, consoleLog;

      beforeEach(function () {
        consoleLog = console.log;
        console.log = log;
      });

      afterEach(function () {
        console.log = consoleLog;
      });

      function log() {
        logCalls.push(Array.prototype.slice.call(arguments));
      }

      it('should log the text from $comment keyword', function() {
        var schema = {
          properties: {
            foo: {$comment: 'property foo'},
            bar: {$comment: 'property bar', type: 'integer'}
          }
        };

        var ajv = new Ajv({$comment: true});
        var fullAjv = new Ajv({allErrors: true, $comment: true});

        [ajv, fullAjv].forEach(function (_ajv) {
          var validate = _ajv.compile(schema);

          test({}, true, []);
          test({foo: 1}, true, [['property foo']]);
          test({foo: 1, bar: 2}, true, [['property foo'], ['property bar']]);
          test({foo: 1, bar: 'baz'}, false, [['property foo'], ['property bar']]);

          function test(data, valid, expectedLogCalls) {
            logCalls = [];
            validate(data) .should.equal(valid);
            logCalls .should.eql(expectedLogCalls);
          }
        });

        console.log = consoleLog;
      });
    });

    describe('function hook', function() {
      var hookCalls;

      function hook() {
        hookCalls.push(Array.prototype.slice.call(arguments));
      }

      it('should pass the text from $comment keyword to the hook', function() {
        var schema = {
          properties: {
            foo: {$comment: 'property foo'},
            bar: {$comment: 'property bar', type: 'integer'}
          }
        };

        var ajv = new Ajv({$comment: hook});
        var fullAjv = new Ajv({allErrors: true, $comment: hook});

        [ajv, fullAjv].forEach(function (_ajv) {
          var validate = _ajv.compile(schema);

          test({}, true, []);
          test({foo: 1}, true, [['property foo', '#/properties/foo/$comment', schema]]);
          test({foo: 1, bar: 2}, true,
            [['property foo', '#/properties/foo/$comment', schema],
             ['property bar', '#/properties/bar/$comment', schema]]);
          test({foo: 1, bar: 'baz'}, false,
            [['property foo', '#/properties/foo/$comment', schema],
             ['property bar', '#/properties/bar/$comment', schema]]);

          function test(data, valid, expectedHookCalls) {
            hookCalls = [];
            validate(data) .should.equal(valid);
            hookCalls .should.eql(expectedHookCalls);
          }
        });
      });
    });
  });


  describe('logger', function() {

    /**
     * The logger option tests are based on the meta scenario which writes into the logger.warn
     */

    var origConsoleWarn = console.warn;
    var consoleCalled;

    beforeEach(function() {
      consoleCalled = false;
      console.warn = function() {
        consoleCalled = true;
      };
    });

    afterEach(function() {
      console.warn = origConsoleWarn;
    });

    it('no custom logger is given - global console should be used', function() {
      var ajv = new Ajv({
        meta: false
      });

      ajv.compile({
        type: 'number',
        minimum: 1
      });

      should.equal(consoleCalled, true);
    });

    it('custom logger is an object - logs should only report to it', function() {
      var loggerCalled = false;

      var logger = {
        warn: log,
        log: log,
        error: log
      };

      var ajv = new Ajv({
        meta: false,
        logger: logger
      });

      ajv.compile({
        type: 'number',
        minimum: 1
      });

      should.equal(loggerCalled, true);
      should.equal(consoleCalled, false);

      function log() {
        loggerCalled = true;
      }
    });

    it('logger option is false - no logs should be reported', function() {
      var ajv = new Ajv({
        meta: false,
        logger: false
      });

      ajv.compile({
        type: 'number',
        minimum: 1
      });

      should.equal(consoleCalled, false);
    });

    it('logger option is an object without required methods - an error should be thrown', function() {
      (function(){
        new Ajv({
          meta: false,
          logger: {}
        });
      }).should.throw(Error, /logger must implement log, warn and error methods/);
    });
  });


  describe('nullable', function() {
    var ajv;

    describe('= true', function() {
      beforeEach(function () {
        ajv = new Ajv({
          nullable: true
        });
      });

      it('should add keyword "nullable"', function() {
        testNullable({
          type: 'number',
          nullable: true
        });

        testNullable({
          type: ['number'],
          nullable: true
        });

        testNullable({
          type: ['number', 'null']
        });

        testNullable({
          type: ['number', 'null'],
          nullable: true
        });

        testNotNullable({type: 'number'});

        testNotNullable({type: ['number']});
      });

      it('"nullable" keyword must be "true" if present', function() {
        should.throw(function() {
          ajv.compile({nullable: false});
        });
      });
    });

    describe('without option "nullable"', function() {
      it('should ignore keyword nullable', function() {
        ajv = new Ajv;

        testNotNullable({
          type: 'number',
          nullable: true
        });

        testNotNullable({
          type: ['number'],
          nullable: true
        });

        testNullable({
          type: ['number', 'null'],
        });

        testNullable({
          type: ['number', 'null'],
          nullable: true
        });

        should.not.throw(function () {
          ajv.compile({nullable: false});
        });
      });
    });

    function testNullable(schema) {
      var validate = ajv.compile(schema);
      validate(1) .should.equal(true);
      validate(null) .should.equal(true);
      validate('1') .should.equal(false);
    }

    function testNotNullable(schema) {
      var validate = ajv.compile(schema);
      validate(1) .should.equal(true);
      validate(null) .should.equal(false);
      validate('1') .should.equal(false);
    }
  });
});
