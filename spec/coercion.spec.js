'use strict';

var Ajv = require('./ajv')
  , should = require('./chai').should();


var coercionRules = {
  'string': {
    'number': [
      { from: 1, to: '1' },
      { from: 1.5, to: '1.5' },
      { from: 2e100, to: '2e+100' }
    ],
    'boolean': [
      { from: false, to: 'false' },
      { from: true, to: 'true' }
    ],
    'null': [
      { from: null, to: '' }
    ],
    'object': [
      { from: {}, to: undefined }
    ],
    'array': [
      { from: [], to: undefined }
    ]
  },
  'number': {
    'string': [
      { from: '1', to: 1 },
      { from: '1.5', to: 1.5 },
      { from: '2e10', to: 2e10 },
      { from: '1a', to: undefined },
      { from: 'abc', to: undefined },
      { from: '', to: undefined }
    ],
    'boolean': [
      { from: false, to: 0 },
      { from: true, to: 1 }
    ],
    'null': [
      { from: null, to: 0 }
    ],
    'object': [
      { from: {}, to: undefined }
    ],
    'array': [
      { from: [], to: undefined }
    ]
  },
  'integer': {
    'string': [
      { from: '1', to: 1 },
      { from: '1.5', to: undefined },
      { from: '2e10', to: 2e10 },
      { from: '1a', to: undefined },
      { from: 'abc', to: undefined },
      { from: '', to: undefined }
    ],
    'boolean': [
      { from: false, to: 0 },
      { from: true, to: 1 }
    ],
    'null': [
      { from: null, to: 0 }
    ],
    'object': [
      { from: {}, to: undefined }
    ],
    'array': [
      { from: [], to: undefined }
    ]
  },
  'boolean': {
    'string': [
      { from: 'false', to: false },
      { from: 'true', to: true },
      { from: '', to: undefined },
      { from: 'abc', to: undefined },
    ],
    'number': [
      { from: 0, to: false },
      { from: 1, to: true },
      { from: 2, to: undefined },
      { from: 2.5, to: undefined }
    ],
    'null': [
      { from: null, to: false }
    ],
    'object': [
      { from: {}, to: undefined }
    ],
    'array': [
      { from: [], to: undefined }
    ]
  },
  'null': {
    'string': [
      { from: '',     to: null },
      { from: 'abc',  to: undefined },
      { from: 'null', to: undefined }
    ],
    'number': [
      { from: 0, to: null },
      { from: 1, to: undefined }
    ],
    'boolean': [
      { from: false, to: null },
      { from: true,  to: undefined }
    ],
    'object': [
      { from: {}, to: undefined }
    ],
    'array': [
      { from: [], to: undefined }
    ]
  },
  'object': {
    'all': [
      { type: 'string',  from: 'abc', to: undefined },
      { type: 'number',  from: 1,     to: undefined },
      { type: 'boolean', from: true,  to: undefined },
      { type: 'null',    from: null,  to: undefined },
      { type: 'array',   from: [],    to: undefined }
    ]
  },
  'array': {
    'all': [
      { type: 'string',  from: 'abc', to: undefined },
      { type: 'number',  from: 1,     to: undefined },
      { type: 'boolean', from: true,  to: undefined },
      { type: 'null',    from: null,  to: undefined },
      { type: 'object',  from: {},    to: undefined }
    ]
  }
};


describe('Type coercion', function () {
  var ajv, fullAjv, instances;

  beforeEach(function() {
    ajv = Ajv({ coerceTypes: true, verbose: true });
    fullAjv = Ajv({ coerceTypes: true, verbose: true, allErrors: true });
    instances = [ ajv, fullAjv ];
  });


  it('should coerce scalar values', function() {
    testRules(function (test, schema, canCoerce, toType, fromType) {
      instances.forEach(function (ajv) {
        var valid = ajv.validate(schema, test.from);
        if (valid !== canCoerce) console.log(toType, fromType, test, ajv.errors);
        valid. should.equal(canCoerce);
      });
    })
  });


  it('should coerce values in objects/arrays and update properties/items', function() {
    testRules(function (test, schema, canCoerce, toType, fromType) {
      var schemaObject = {
        type: 'object',
        properties: {
          foo: schema
        }
      };

      var schemaArray = {
        type: 'array',
        items: schema
      };

      var schemaArrObj = {
        type: 'array',
        items: schemaObject
      };


      instances.forEach(function (ajv) {
        testCoercion(schemaArray,  [ test.from ], [ test.to ]);
        testCoercion(schemaObject, { foo: test.from }, { foo: test.to });
        testCoercion(schemaArrObj, [ { foo: test.from } ], [ { foo: test.to } ]);
      });

      function testCoercion(schema, fromData, toData) {
        var valid = ajv.validate(schema, fromData);
        // if (valid !== canCoerce) console.log(schema, fromData, toData);
        valid. should.equal(canCoerce);
        if (valid) fromData .should.eql(toData);
      }
    })
  });


  it('should coerce to multiple types in order', function() {
      var schema = {
        type: 'object',
        properties: {
          foo: {
            type: [ 'number', 'boolean', 'null' ]
          }
        }
      };

      var data;

      ajv.validate(schema, data = { foo: '1' }) .should.equal(true);
      data .should.eql({ foo: 1 });

      ajv.validate(schema, data = { foo: '1.5' }) .should.equal(true);
      data .should.eql({ foo: 1.5 });

      ajv.validate(schema, data = { foo: 'false' }) .should.equal(true);
      data .should.eql({ foo: false });

      ajv.validate(schema, data = { foo: 1 }) .should.equal(true);
      data .should.eql({ foo: 1 }); // no coercion

      ajv.validate(schema, data = { foo: true }) .should.equal(true);
      data .should.eql({ foo: true }); // no coercion

      ajv.validate(schema, data = { foo: null }) .should.equal(true);
      data .should.eql({ foo: null }); // no coercion

      ajv.validate(schema, data = { foo: 'abc' }) .should.equal(false);
      data .should.eql({ foo: 'abc' }); // can't coerce

      ajv.validate(schema, data = { foo: {} }) .should.equal(false);
      data .should.eql({ foo: {} }); // can't coerce

      ajv.validate(schema, data = { foo: [] }) .should.equal(false);
      data .should.eql({ foo: [] }); // can't coerce
  });


  function testRules(cb) {
    for (var toType in coercionRules) {
      for (var fromType in coercionRules[toType]) {
        var tests = coercionRules[toType][fromType];
        tests.forEach(function (test) {
          var canCoerce = test.to !== undefined;
          var schema = canCoerce
                         ? { type: toType, enum: [ test.to ] }
                         : { type: toType };
          cb(test, schema, canCoerce, toType, fromType);
        });
      }
    }
  }
});
