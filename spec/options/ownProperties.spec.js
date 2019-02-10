'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('ownProperties option', function() {
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
