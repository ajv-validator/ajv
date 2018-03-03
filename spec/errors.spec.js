'use strict';

var Ajv = require('./ajv')
  , should = require('./chai').should();


describe('Validation errors', function () {
  var ajv, ajvJP, fullAjv;

  beforeEach(function() {
    createInstances();
  });

  function createInstances(errorDataPath) {
    ajv = new Ajv({ errorDataPath: errorDataPath, loopRequired: 21 });
    ajvJP = new Ajv({ errorDataPath: errorDataPath, jsonPointers: true, loopRequired: 21 });
    fullAjv = new Ajv({ errorDataPath: errorDataPath, allErrors: true, verbose: true, jsonPointers: true, loopRequired: 21 });
  }

  it('error should include dataPath', function() {
    var schema = {
      properties: {
        foo: { type: 'number' }
      }
    };

    testSchema1(schema);
  });

  it('"refs" error should include dataPath', function() {
    var schema = {
      definitions: {
        num: { type: 'number' }
      },
      properties: {
        foo: { $ref: '#/definitions/num' }
      }
    };

    testSchema1(schema, '#/definitions/num');
  });


  describe('"additionalProperties" errors', function() {
    it('should include property in dataPath with option errorDataPath="property"', function() {
      createInstances('property');
      testAdditional('property');
    });

    it('should NOT include property in dataPath WITHOUT option errorDataPath', function() {
      testAdditional();
    });

    function testAdditional(errorDataPath) {
      var schema = {
        properties: {
          foo: {},
          bar: {}
        },
        additionalProperties: false
      };

      var data = { foo: 1, bar: 2 }
        , invalidData = { foo: 1, bar: 2, baz: 3, quux: 4 };

      var path = pathFunc(errorDataPath);
      var msg = additionalFunc(errorDataPath);

      var validate = ajv.compile(schema);
      shouldBeValid(validate, data);
      shouldBeInvalid(validate, invalidData);
      shouldBeError(validate.errors[0], 'additionalProperties', '#/additionalProperties', path("['baz']"), msg, { additionalProperty: 'baz' });

      var validateJP = ajvJP.compile(schema);
      shouldBeValid(validateJP, data);
      shouldBeInvalid(validateJP, invalidData);
      shouldBeError(validateJP.errors[0], 'additionalProperties', '#/additionalProperties', path("/baz"), msg, { additionalProperty: 'baz' });

      var fullValidate = fullAjv.compile(schema);
      shouldBeValid(fullValidate, data);
      shouldBeInvalid(fullValidate, invalidData, 2);
      shouldBeError(fullValidate.errors[0], 'additionalProperties', '#/additionalProperties', path('/baz'), msg, { additionalProperty: 'baz' });
      shouldBeError(fullValidate.errors[1], 'additionalProperties', '#/additionalProperties', path('/quux'), msg, { additionalProperty: 'quux' });

      if (errorDataPath == 'property') {
        fullValidate.errors
        .filter(function(err) { return err.keyword == 'additionalProperties'; })
        .map(function(err) { return fullAjv._opts.jsonPointers ? err.dataPath.substr(1) : err.dataPath.slice(2,-2); })
        .forEach(function(p) { delete invalidData[p]; });

        invalidData .should.eql({ foo: 1, bar: 2 });
      }
    }
  });


  describe('errors when "additionalProperties" is schema', function() {
    it('should include property in dataPath with option errorDataPath="property"', function() {
      createInstances('property');
      testAdditionalIsSchema('property');
    });

    it('should NOT include property in dataPath WITHOUT option errorDataPath', function() {
      testAdditionalIsSchema();
    });

    function testAdditionalIsSchema() {
      var schema = {
        properties: {
          foo: { type: 'integer' },
          bar: { type: 'integer' }
        },
        additionalProperties: {
          type: 'object',
          properties: {
            quux: { type: 'string' }
          }
        }
      };

      var data = { foo: 1, bar: 2, baz: { quux: 'abc' } }
        , invalidData = { foo: 1, bar: 2, baz: { quux: 3 }, boo: { quux: 4 } };

      var schPath = '#/additionalProperties/properties/quux/type';

      var validate = ajv.compile(schema);
      shouldBeValid(validate, data);
      shouldBeInvalid(validate, invalidData);
      shouldBeError(validate.errors[0], 'type', schPath, "['baz'].quux", 'should be string', { type: 'string' });

      var validateJP = ajvJP.compile(schema);
      shouldBeValid(validateJP, data);
      shouldBeInvalid(validateJP, invalidData);
      shouldBeError(validateJP.errors[0], 'type', schPath, "/baz/quux", 'should be string', { type: 'string' });

      var fullValidate = fullAjv.compile(schema);
      shouldBeValid(fullValidate, data);
      shouldBeInvalid(fullValidate, invalidData, 2);
      shouldBeError(fullValidate.errors[0], 'type', schPath, '/baz/quux', 'should be string', { type: 'string' });
      shouldBeError(fullValidate.errors[1], 'type', schPath, '/boo/quux', 'should be string', { type: 'string' });
    }
  });


  describe('"required" errors', function() {
    it('should include missing property in dataPath with option errorDataPath="property"', function() {
      createInstances('property');
      testRequired('property');
    });

    it('should NOT include missing property in dataPath WITHOUT option errorDataPath', function() {
      testRequired();
    });

    function testRequired(errorDataPath) {
      var schema = {
        required: ['foo', 'bar', 'baz']
      };

      _testRequired(errorDataPath, schema, '#', '.');
    }


    it('large data/schemas with option errorDataPath="property"', function() {
      createInstances('property');
      testRequiredLargeSchema('property');
    });

    it('large data/schemas WITHOUT option errorDataPath', function() {
      testRequiredLargeSchema();
    });

    function testRequiredLargeSchema(errorDataPath) {
      var schema = { required: [] }
        , data = {}
        , invalidData1 = {}
        , invalidData2 = {};
      for (var i=0; i<100; i++) {
        schema.required.push(''+i); // properties from '0' to '99' are required
        data[i] = invalidData1[i] = invalidData2[i] = i;
      }

      delete invalidData1[1]; // property '1' will be missing
      delete invalidData2[2]; // properties '2' and '198' will be missing
      delete invalidData2[98];

      var path = pathFunc(errorDataPath);
      var msg = requiredFunc(errorDataPath);

      test();

      schema = { anyOf: [ schema ] };
      test(1, '#/anyOf/0');

      function test(extraErrors, schemaPathPrefix) {
        extraErrors = extraErrors || 0;
        var schPath = (schemaPathPrefix || '#') + '/required';
        var validate = ajv.compile(schema);
        shouldBeValid(validate, data);
        shouldBeInvalid(validate, invalidData1, 1 + extraErrors);
        shouldBeError(validate.errors[0], 'required', schPath, path("['1']"), msg('1'), { missingProperty: '1' });
        shouldBeInvalid(validate, invalidData2, 1 + extraErrors);
        shouldBeError(validate.errors[0], 'required', schPath, path("['2']"), msg('2'), { missingProperty: '2' });

        var validateJP = ajvJP.compile(schema);
        shouldBeValid(validateJP, data);
        shouldBeInvalid(validateJP, invalidData1, 1 + extraErrors);
        shouldBeError(validateJP.errors[0], 'required', schPath, path("/1"), msg('1'), { missingProperty: '1' });
        shouldBeInvalid(validateJP, invalidData2, 1 + extraErrors);
        shouldBeError(validateJP.errors[0], 'required', schPath, path("/2"), msg('2'), { missingProperty: '2' });

        var fullValidate = fullAjv.compile(schema);
        shouldBeValid(fullValidate, data);
        shouldBeInvalid(fullValidate, invalidData1, 1 + extraErrors);
        shouldBeError(fullValidate.errors[0], 'required', schPath, path('/1'), msg('1'), { missingProperty: '1' });
        shouldBeInvalid(fullValidate, invalidData2, 2 + extraErrors);
        shouldBeError(fullValidate.errors[0], 'required', schPath, path('/2'), msg('2'), { missingProperty: '2' });
        shouldBeError(fullValidate.errors[1], 'required', schPath, path('/98'), msg('98'), { missingProperty: '98' });
      }
    }


    it('with "properties" with option errorDataPath="property"', function() {
      createInstances('property');
      testRequiredAndProperties('property');
    });

    it('with "properties" WITHOUT option errorDataPath', function() {
      testRequiredAndProperties();
    });

    function testRequiredAndProperties(errorDataPath) {
      var schema = {
        properties: {
          'foo': { type: 'number' },
          'bar': { type: 'number' },
          'baz': { type: 'number' },
        },
        required: ['foo', 'bar', 'baz']
      };

      _testRequired(errorDataPath, schema);
    }


    it('in "anyOf" with option errorDataPath="property"', function() {
      createInstances('property');
      testRequiredInAnyOf('property');
    });

    it('in "anyOf" WITHOUT option errorDataPath', function() {
      testRequiredInAnyOf();
    });

    function testRequiredInAnyOf(errorDataPath) {
      var schema = {
        anyOf: [
          { required: ['foo', 'bar', 'baz'] }
        ]
      };

      _testRequired(errorDataPath, schema, '#/anyOf/0', '.', 1);
    }


    it('should not validate required twice in large schemas with loopRequired option', function() {
      ajv = new Ajv({ loopRequired: 1, allErrors: true });

      var schema = {
        properties: {
          foo: { type: 'integer' },
          bar: { type: 'integer' }
        },
        required: ['foo', 'bar']
      };

      var validate = ajv.compile(schema);

      validate({}) .should.equal(false);
      validate.errors .should.have.length(2);
    });


    it('should not validate required twice with $data ref', function() {
      ajv = new Ajv({ $data: true, allErrors: true });

      var schema = {
        properties: {
          foo: { type: 'integer' },
          bar: { type: 'integer' }
        },
        required: { $data: '0/requiredProperties' }
      };

      var validate = ajv.compile(schema);

      validate({ requiredProperties: ['foo', 'bar'] }) .should.equal(false);
      validate.errors .should.have.length(2);
    });
  });


  describe('"dependencies" errors', function() {
    it('should include missing property in dataPath with option errorDataPath="property"', function() {
      createInstances('property');
      testDependencies('property');
    });

    it('should NOT include missing property in dataPath WITHOUT option errorDataPath', function() {
      testDependencies();
    });

    function testDependencies(errorDataPath) {
      var schema = {
        dependencies: {
          a: ['foo', 'bar', 'baz']
        }
      };

      var data = { a: 0, foo: 1, bar: 2, baz: 3 }
        , invalidData1 = { a: 0, foo: 1, baz: 3 }
        , invalidData2 = { a: 0, bar: 2 };

      var path = pathFunc(errorDataPath);
      var msg = 'should have properties foo, bar, baz when property a is present';

      var validate = ajv.compile(schema);
      shouldBeValid(validate, data);
      shouldBeInvalid(validate, invalidData1);
      shouldBeError(validate.errors[0], 'dependencies', '#/dependencies', path('.bar'), msg, params('.bar'));
      shouldBeInvalid(validate, invalidData2);
      shouldBeError(validate.errors[0], 'dependencies', '#/dependencies', path('.foo'), msg, params('.foo'));

      var validateJP = ajvJP.compile(schema);
      shouldBeValid(validateJP, data);
      shouldBeInvalid(validateJP, invalidData1);
      shouldBeError(validateJP.errors[0], 'dependencies', '#/dependencies', path('/bar'), msg, params('bar'));
      shouldBeInvalid(validateJP, invalidData2);
      shouldBeError(validateJP.errors[0], 'dependencies', '#/dependencies', path('/foo'),  msg, params('foo'));

      var fullValidate = fullAjv.compile(schema);
      shouldBeValid(fullValidate, data);
      shouldBeInvalid(fullValidate, invalidData1);
      shouldBeError(fullValidate.errors[0], 'dependencies', '#/dependencies', path('/bar'), msg, params('bar'));
      shouldBeInvalid(fullValidate, invalidData2, 2);
      shouldBeError(fullValidate.errors[0], 'dependencies', '#/dependencies', path('/foo'), msg, params('foo'));
      shouldBeError(fullValidate.errors[1], 'dependencies', '#/dependencies', path('/baz'), msg, params('baz'));

      function params(missing) {
        var p = {
          property: 'a',
          deps: 'foo, bar, baz',
          depsCount: 3
        };
        p.missingProperty = missing;
        return p;
      }
    }
  });


  function _testRequired(errorDataPath, schema, schemaPathPrefix, prefix, extraErrors) {
    var schPath = (schemaPathPrefix || '#') + '/required';
    prefix = prefix || '';
    extraErrors = extraErrors || 0;

    var data = { foo: 1, bar: 2, baz: 3 }
      , invalidData1 = { foo: 1, baz: 3 }
      , invalidData2 = { bar: 2 };

    var path = pathFunc(errorDataPath);
    var msg = requiredFunc(errorDataPath);

    var validate = ajv.compile(schema);
    shouldBeValid(validate, data);
    shouldBeInvalid(validate, invalidData1, 1 + extraErrors);
    shouldBeError(validate.errors[0], 'required', schPath, path('.bar'), msg(prefix + 'bar'), { missingProperty: prefix + 'bar' });
    shouldBeInvalid(validate, invalidData2, 1 + extraErrors);
    shouldBeError(validate.errors[0], 'required', schPath, path('.foo'), msg(prefix + 'foo'), { missingProperty: prefix + 'foo' });

    var validateJP = ajvJP.compile(schema);
    shouldBeValid(validateJP, data);
    shouldBeInvalid(validateJP, invalidData1, 1 + extraErrors);
    shouldBeError(validateJP.errors[0], 'required', schPath, path('/bar'), msg('bar'), { missingProperty: 'bar' });
    shouldBeInvalid(validateJP, invalidData2, 1 + extraErrors);
    shouldBeError(validateJP.errors[0], 'required', schPath, path('/foo'),  msg('foo'), { missingProperty: 'foo' });

    var fullValidate = fullAjv.compile(schema);
    shouldBeValid(fullValidate, data);
    shouldBeInvalid(fullValidate, invalidData1, 1 + extraErrors);
    shouldBeError(fullValidate.errors[0], 'required', schPath, path('/bar'), msg('bar'), { missingProperty: 'bar' });
    shouldBeInvalid(fullValidate, invalidData2, 2 + extraErrors);
    shouldBeError(fullValidate.errors[0], 'required', schPath, path('/foo'), msg('foo'), { missingProperty: 'foo' });
    shouldBeError(fullValidate.errors[1], 'required', schPath, path('/baz'), msg('baz'), { missingProperty: 'baz' });
  }

  function pathFunc(errorDataPath) {
    return function (dataPath) {
      return errorDataPath == 'property' ? dataPath : '';
    };
  }

  function requiredFunc(errorDataPath) {
    return function (prop) {
      return errorDataPath == 'property'
              ? 'is a required property'
              : 'should have required property \'' + prop + '\'';
    };
  }

  function additionalFunc(errorDataPath) {
    return errorDataPath == 'property'
            ? 'is an invalid additional property'
            : 'should NOT have additional properties';
  }


  it('"items" errors should include item index without quotes in dataPath (#48)', function() {
    var schema1 = {
      $id: 'schema1',
      type: 'array',
      items: {
        type: 'integer',
        minimum: 10
      }
    };

    var data = [ 10, 11, 12]
      , invalidData1 = [ 1, 10 ]
      , invalidData2 = [ 10, 9, 11, 8, 12];

    var validate = ajv.compile(schema1);
    shouldBeValid(validate, data);
    shouldBeInvalid(validate, invalidData1);
    shouldBeError(validate.errors[0], 'minimum', '#/items/minimum', '[0]', 'should be >= 10');
    shouldBeInvalid(validate, invalidData2);
    shouldBeError(validate.errors[0], 'minimum', '#/items/minimum', '[1]', 'should be >= 10');

    var validateJP = ajvJP.compile(schema1);
    shouldBeValid(validateJP, data);
    shouldBeInvalid(validateJP, invalidData1);
    shouldBeError(validateJP.errors[0], 'minimum', '#/items/minimum', '/0', 'should be >= 10');
    shouldBeInvalid(validateJP, invalidData2);
    shouldBeError(validateJP.errors[0], 'minimum', '#/items/minimum', '/1', 'should be >= 10');

    var fullValidate = fullAjv.compile(schema1);
    shouldBeValid(fullValidate, data);
    shouldBeInvalid(fullValidate, invalidData1);
    shouldBeError(fullValidate.errors[0], 'minimum', '#/items/minimum', '/0', 'should be >= 10');
    shouldBeInvalid(fullValidate, invalidData2, 2);
    shouldBeError(fullValidate.errors[0], 'minimum', '#/items/minimum', '/1', 'should be >= 10');
    shouldBeError(fullValidate.errors[1], 'minimum', '#/items/minimum', '/3', 'should be >= 10');

    var schema2 = {
      $id: 'schema2',
      type: 'array',
      items: [{ minimum: 10 }, { minimum: 9 }, { minimum: 12 }]
    };

    validate = ajv.compile(schema2);
    shouldBeValid(validate, data);
    shouldBeInvalid(validate, invalidData1);
    shouldBeError(validate.errors[0], 'minimum', '#/items/0/minimum', '[0]', 'should be >= 10');
    shouldBeInvalid(validate, invalidData2);
    shouldBeError(validate.errors[0], 'minimum', '#/items/2/minimum', '[2]', 'should be >= 12');
  });


  it('should have correct schema path for additionalItems', function() {
    var schema = {
      type: 'array',
      items: [ { type: 'integer' }, { type: 'integer' } ],
      additionalItems: false
    };

    var data = [ 1, 2 ]
      , invalidData = [ 1, 2, 3 ];

    test(ajv);
    test(ajvJP);
    test(fullAjv);

    function test(_ajv) {
      var validate = _ajv.compile(schema);
      shouldBeValid(validate, data);
      shouldBeInvalid(validate, invalidData);
      shouldBeError(validate.errors[0], 'additionalItems', '#/additionalItems', '', 'should NOT have more than 2 items');
    }
  });


  describe('"propertyNames" errors', function() {
    it('should add propertyName to errors', function() {
      var schema = {
        type: 'object',
        propertyNames: { format: 'email' }
      };

      var data = {
        'bar.baz@email.example.com': {}
      };

      var invalidData = {
        'foo': {},
        'bar': {},
        'bar.baz@email.example.com': {}
      };

      test(ajv, 2);
      test(ajvJP, 2);
      test(fullAjv, 4);

      function test(_ajv, numErrors) {
        var validate = _ajv.compile(schema);
        shouldBeValid(validate, data);
        shouldBeInvalid(validate, invalidData, numErrors);
        shouldBeError(validate.errors[0], 'format', '#/propertyNames/format', '', 'should match format "email"');
        shouldBeError(validate.errors[1], 'propertyNames', '#/propertyNames', '', 'property name \'foo\' is invalid');
        if (numErrors == 4) {
          shouldBeError(validate.errors[2], 'format', '#/propertyNames/format', '', 'should match format "email"');
          shouldBeError(validate.errors[3], 'propertyNames', '#/propertyNames', '', 'property name \'bar\' is invalid');
        }
      }
    });
  });


  describe('oneOf errors', function() {
    it('should have errors from inner schemas', function() {
      var schema = {
        oneOf: [
          { type: 'number' },
          { type: 'integer' }
        ]
      };

      test(ajv);
      test(fullAjv);

      function test(_ajv) {
        var validate = _ajv.compile(schema);
        validate('foo') .should.equal(false);
        validate.errors.length .should.equal(3);
        validate(1) .should.equal(false);
        validate.errors.length .should.equal(1);
        validate(1.5) .should.equal(true);
      }
    });

    it('should return passing schemas in error params', function() {
      var schema = {
        oneOf: [
          { type: 'number' },
          { type: 'integer' },
          { const: 1.5 }
        ]
      };

      test(ajv);
      test(fullAjv);

      function test(_ajv) {
        var validate = _ajv.compile(schema);
        validate(1) .should.equal(false);
        var err = validate.errors.pop();
        err.keyword .should.equal('oneOf');
        err.params .should.eql({passingSchemas: [0, 1]});

        validate(1.5) .should.equal(false);
        err = validate.errors.pop();
        err.keyword .should.equal('oneOf');
        err.params .should.eql({passingSchemas: [0, 2]});

        validate(2.5) .should.equal(true);

        validate('foo') .should.equal(false);
        err = validate.errors.pop();
        err.keyword .should.equal('oneOf');
        err.params .should.eql({passingSchemas: null});
      }
    });
  });


  describe('anyOf errors', function() {
    it('should have errors from inner schemas', function() {
      var schema = {
        anyOf: [
          { type: 'number' },
          { type: 'integer' }
        ]
      };

      test(ajv);
      test(fullAjv);

      function test(_ajv) {
        var validate = _ajv.compile(schema);
        validate('foo') .should.equal(false);
        validate.errors.length .should.equal(3);
        validate(1) .should.equal(true);
        validate(1.5) .should.equal(true);
      }
    });
  });


  describe('type errors', function() {
    describe('integer', function() {
      it('should have only one error in {allErrors: false} mode', function() {
        test(ajv);
      });

      it('should return all errors in {allErrors: true} mode', function() {
        test(fullAjv, 2);
      });

      function test(_ajv, numErrors) {
        var schema = {
          type: 'integer',
          minimum: 5
        };


        var validate = _ajv.compile(schema);
        shouldBeValid(validate, 5);
        shouldBeInvalid(validate, 5.5);
        shouldBeInvalid(validate, 4);
        shouldBeInvalid(validate, '4');
        shouldBeInvalid(validate, 4.5, numErrors);
      }
    });

    describe('keyword for another type', function() {
      it('should have only one error in {allErrors: false} mode', function() {
        test(ajv);
      });

      it('should return all errors in {allErrors: true} mode', function() {
        test(fullAjv, 2);
      });

      function test(_ajv, numErrors) {
        var schema = {
          type: 'array',
          minItems: 2,
          minimum: 5
        };


        var validate = _ajv.compile(schema);
        shouldBeValid(validate, [1, 2]);
        shouldBeInvalid(validate, [1]);
        shouldBeInvalid(validate, 5);
        shouldBeInvalid(validate, 4, numErrors);
      }
    });

    describe('array of types', function() {
      it('should have only one error in {allErrors: false} mode', function() {
        test(ajv);
      });

      it('should return all errors in {allErrors: true} mode', function() {
        test(fullAjv, 2);
      });

      function test(_ajv, numErrors) {
        var schema = {
          type: ['array', 'object'],
          minItems: 2,
          minProperties: 2,
          minimum: 5
        };


        var validate = _ajv.compile(schema);
        shouldBeValid(validate, [1, 2]);
        shouldBeValid(validate, {foo: 1, bar: 2});
        shouldBeInvalid(validate, [1]);
        shouldBeInvalid(validate, {foo: 1});
        shouldBeInvalid(validate, 5);
        shouldBeInvalid(validate, 4, numErrors);
      }
    });
  });


  describe('exclusiveMaximum/Minimum errors', function() {
    it('should include limits in error message', function() {
      var schema = {
        type: 'integer',
        exclusiveMinimum: 2,
        exclusiveMaximum: 5
      };

      [ajv, fullAjv].forEach(function (_ajv) {
        var validate = _ajv.compile(schema);
        shouldBeValid(validate, 3);
        shouldBeValid(validate, 4);

        shouldBeInvalid(validate, 2);
        testError('exclusiveMinimum', 'should be > 2', {comparison: '>', limit: 2, exclusive: true});

        shouldBeInvalid(validate, 5);
        testError('exclusiveMaximum', 'should be < 5', {comparison: '<', limit: 5, exclusive: true});

        function testError(keyword, message, params) {
          var err = validate.errors[0];
          shouldBeError(err, keyword, '#/' + keyword, '', message, params);
        }
      });
    });

    it('should include limits in error message with $data', function() {
      var schema = {
        "properties": {
          "smaller": {
            "type": "number",
            "exclusiveMaximum": { "$data": "1/larger" }
          },
          "larger": { "type": "number" }
        }
      };

      ajv = new Ajv({$data: true});
      fullAjv = new Ajv({$data: true, allErrors: true, verbose: true, jsonPointers: true});

      [ajv, fullAjv].forEach(function (_ajv) {
        var validate = _ajv.compile(schema);
        shouldBeValid(validate, {smaller: 2, larger: 4});
        shouldBeValid(validate, {smaller: 3, larger: 4});

        shouldBeInvalid(validate, {smaller: 4, larger: 4});
        testError();

        shouldBeInvalid(validate, {smaller: 5, larger: 4});
        testError();

        function testError() {
          var err = validate.errors[0];
          shouldBeError(err, 'exclusiveMaximum',
                        '#/properties/smaller/exclusiveMaximum',
                        _ajv._opts.jsonPointers ? '/smaller' : '.smaller',
                        'should be < 4',
                        {comparison: '<', limit: 4, exclusive: true});
        }
      });
    });
  });


  describe('if/then/else errors', function() {
    var validate, numErrors;

    it('if/then/else should include failing keyword in message and params', function() {
      var schema = {
        'if': { maximum: 10 },
        'then': { multipleOf: 2 },
        'else': { multipleOf: 5 }
      };

      [ajv, fullAjv].forEach(function (_ajv) {
        prepareTest(_ajv, schema);
        shouldBeValid(validate, 8);
        shouldBeValid(validate, 15);

        shouldBeInvalid(validate, 7, numErrors);
        testIfError('then', 2);

        shouldBeInvalid(validate, 17, numErrors);
        testIfError('else', 5);
      });
    });

    it('if/then should include failing keyword in message and params', function() {
      var schema = {
        'if': { maximum: 10 },
        'then': { multipleOf: 2 }
      };

      [ajv, fullAjv].forEach(function (_ajv) {
        prepareTest(_ajv, schema);
        shouldBeValid(validate, 8);
        shouldBeValid(validate, 11);
        shouldBeValid(validate, 12);

        shouldBeInvalid(validate, 7, numErrors);
        testIfError('then', 2);
      });
    });

    it('if/else should include failing keyword in message and params', function() {
      var schema = {
        'if': { maximum: 10 },
        'else': { multipleOf: 5 }
      };

      [ajv, fullAjv].forEach(function (_ajv) {
        prepareTest(_ajv, schema);
        shouldBeValid(validate, 7);
        shouldBeValid(validate, 8);
        shouldBeValid(validate, 15);

        shouldBeInvalid(validate, 17, numErrors);
        testIfError('else', 5);
      });
    });

    function prepareTest(_ajv, schema) {
      validate = _ajv.compile(schema);
      numErrors = _ajv._opts.allErrors ? 2 : 1;
    }

    function testIfError(ifClause, multipleOf) {
      var err = validate.errors[0];
      shouldBeError(err, 'multipleOf', '#/' + ifClause + '/multipleOf', '',
        'should be multiple of ' + multipleOf, {multipleOf: multipleOf});

      if (numErrors == 2) {
        err = validate.errors[1];
        shouldBeError(err, 'if', '#/if', '',
          'should match "' + ifClause + '" schema', {failingKeyword: ifClause});
      }
    }
  });


  describe('uniqueItems errors', function() {
    it('should not return uniqueItems error when non-unique items are of a different type than required', function() {
      var schema = {
        items: {type: 'number'},
        uniqueItems: true
      };

      [ajvJP, fullAjv].forEach(function (_ajv) {
        var validate = _ajv.compile(schema);
        shouldBeValid(validate, [1, 2, 3]);

        shouldBeInvalid(validate, [1, 2, 2]);
        shouldBeError(validate.errors[0], 'uniqueItems', '#/uniqueItems', '',
          'should NOT have duplicate items (items ## 2 and 1 are identical)',
          {i: 1, j: 2});

        var expectedErrors = _ajv._opts.allErrors ? 2 : 1;
        shouldBeInvalid(validate, [1, "2", "2", 2], expectedErrors);
        testTypeError(0, '/1');
        if (expectedErrors == 2) testTypeError(1, '/2');

        function testTypeError(i, dataPath) {
          var err = validate.errors[i];
          shouldBeError(err, 'type', '#/items/type', dataPath, 'should be number');
        }
      });
    });
  });


  function testSchema1(schema, schemaPathPrefix) {
    _testSchema1(ajv, schema, schemaPathPrefix);
    _testSchema1(ajvJP, schema, schemaPathPrefix);
    _testSchema1(fullAjv, schema, schemaPathPrefix);
  }


  function _testSchema1(_ajv, schema, schemaPathPrefix) {
    var schPath = (schemaPathPrefix || '#/properties/foo') + '/type';

    var data = { foo: 1 }
      , invalidData = { foo: 'bar' };

    var validate = _ajv.compile(schema);
    shouldBeValid(validate, data);
    shouldBeInvalid(validate, invalidData);
    shouldBeError(validate.errors[0], 'type', schPath, _ajv._opts.jsonPointers ? '/foo' : '.foo');
  }


  function shouldBeValid(validate, data) {
    validate(data) .should.equal(true);
    should.equal(validate.errors, null);
  }


  function shouldBeInvalid(validate, data, numErrors) {
    validate(data) .should.equal(false);
    should.equal(validate.errors.length, numErrors || 1);
  }


  function shouldBeError(error, keyword, schemaPath, dataPath, message, params) {
    error.keyword .should.equal(keyword);
    error.schemaPath .should.equal(schemaPath);
    error.dataPath .should.equal(dataPath);
    error.message .should.be.a('string');
    if (message !== undefined) error.message .should.equal(message);
    if (params !== undefined) error.params .should.eql(params);
  }
});
