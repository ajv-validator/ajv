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

      var validate = ajv.compile(schema);
      shouldBeValid(validate, data);
      shouldBeInvalid(validate, invalidData);
      shouldBeError(validate.errors[0], 'additionalProperties', '#/additionalProperties', path("['baz']"), undefined, { additionalProperty: 'baz' });

      var validateJP = ajvJP.compile(schema);
      shouldBeValid(validateJP, data);
      shouldBeInvalid(validateJP, invalidData);
      shouldBeError(validateJP.errors[0], 'additionalProperties', '#/additionalProperties', path("/baz"), undefined, { additionalProperty: 'baz' });

      var fullValidate = fullAjv.compile(schema);
      shouldBeValid(fullValidate, data);
      shouldBeInvalid(fullValidate, invalidData, 2);
      shouldBeError(fullValidate.errors[0], 'additionalProperties', '#/additionalProperties', path('/baz'), undefined, { additionalProperty: 'baz' });
      shouldBeError(fullValidate.errors[1], 'additionalProperties', '#/additionalProperties', path('/quux'), undefined, { additionalProperty: 'quux' });

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
      var msg = msgFunc(errorDataPath);

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
    var msg = msgFunc(errorDataPath);

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

  function msgFunc(errorDataPath) {
    return function (prop) {
      return errorDataPath == 'property'
              ? 'is a required property'
              : 'should have required property \'' + prop + '\'';
    };
  }


  it('"items" errors should include item index without quotes in dataPath (#48)', function() {
    var schema1 = {
      id: 'schema1',
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
      id: 'schema2',
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
