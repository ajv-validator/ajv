'use strict';

var Ajv = require('../ajv');
var getAjvInstances = require('../ajv_instances');
require('../chai').should();


describe('useDefaults options', function() {
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

    it('should assign defaults when useDefaults = "empty"', function() {
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
