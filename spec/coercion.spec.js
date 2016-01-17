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
    ]
  },
  'null': {
    'string': [
      { from: '', to: null }
    ],
    'number': [
      { from: 0, to: null }
    ],
    'boolean': [
      { from: false, to: null }
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
    for (var toType in coercionRules) {
      for (var fromType in coercionRules[toType]) {
        var tests = coercionRules[toType][fromType];
        tests.forEach(function (test) {
          var canCoerce = test.to !== undefined;
          var schemaScalar = canCoerce
                         ? { type: toType, enum: [ test.to ] }
                         : { type: toType };

          var schemaObject = {
            type: 'object',
            properties: {
              foo: schemaScalar
            }
          };

          var schemaArray = {
            type: 'array',
            items: schemaScalar
          };

          var schemaArrObj = {
            type: 'array',
            items: schemaObject
          };


          instances.forEach(function (ajv) {
            ajv.validate(schemaScalar, test.from). should.equal(canCoerce);

            testCoercion(schemaObject, { foo: test.from }, { foo: test.to });
            testCoercion(schemaArray,  [ test.from ], [ test.to ]);
            testCoercion(schemaArrObj, [ { foo: test.from } ], [ { foo: test.to } ]);
          })

          function testCoercion(schema, fromData, toData) {
            var valid = ajv.validate(schema, fromData);
            // if (valid !== canCoerce) console.log(schema, fromData, toData);
            valid. should.equal(canCoerce);
            if (valid) fromData .should.eql(toData);
          }
        });
      }
    }    
  });
});
