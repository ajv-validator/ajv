'use strict';

var Ajv = require('./ajv');
require('./chai').should();


describe('boolean schemas', function() {
  var ajvs;

  before(function() {
    ajvs = [
      new Ajv,
      new Ajv({allErrors: true}),
      new Ajv({inlineRefs: false})
    ];
  });

  describe('top level schema', function() {
    describe('schema = true', function() {
      it('should validate any data as valid', function() {
        ajvs.forEach(test(true, true));
      });
    });

    describe('schema = false', function() {
      it('should validate any data as invalid', function() {
        ajvs.forEach(test(false, false));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var validate = ajv.compile(boolSchema);
        testSchema(validate, valid);
      };
    }
  });


  describe('in properties / sub-properties', function() {
    describe('schema = true', function() {
      it('should be valid with any property value', function() {
        ajvs.forEach(test(true, true));
      });
    });

    describe('schema = false', function() {
      it('should be invalid with any property value', function() {
        ajvs.forEach(test(false, false));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var schema = {
          type: 'object',
          properties: {
            foo: boolSchema,
            bar: {
              type: 'object',
              properties: {
                baz: boolSchema
              }
            }
          }
        };

        var validate = ajv.compile(schema);
        validate({ foo: 1,     bar: { baz: 1 }}) .should.equal(valid);
        validate({ foo: '1',   bar: { baz: '1' }}) .should.equal(valid);
        validate({ foo: {},    bar: { baz: {} }}) .should.equal(valid);
        validate({ foo: [],    bar: { baz: [] }}) .should.equal(valid);
        validate({ foo: true,  bar: { baz: true }}) .should.equal(valid);
        validate({ foo: false, bar: { baz: false }}) .should.equal(valid);
        validate({ foo: null,  bar: { baz: null }}) .should.equal(valid);

        validate({ bar: { quux: 1 } }) .should.equal(true);
      };
    }
  });


  describe('in items / sub-items', function() {
    describe('schema = true', function() {
      it('should be valid with any item value', function() {
        ajvs.forEach(test(true, true));
      });
    });

    describe('schema = false', function() {
      it('should be invalid with any item value', function() {
        ajvs.forEach(test(false, false));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var schema = {
          type: 'array',
          items: boolSchema
        };

        var validate = ajv.compile(schema);
        validate([ 1 ]) .should.equal(valid);
        validate([ '1' ]) .should.equal(valid);
        validate([ {} ]) .should.equal(valid);
        validate([ [] ]) .should.equal(valid);
        validate([ true ]) .should.equal(valid);
        validate([ false ]) .should.equal(valid);
        validate([ null ]) .should.equal(valid);

        validate([]) .should.equal(true);

        schema = {
          type: 'array',
          items: [
            true,
            {
              type: 'array',
              items: [
                true,
                boolSchema
              ]
            },
            boolSchema
          ]
        };

        validate = ajv.compile(schema);
        validate([ 1,     [ 1, 1 ],         1 ]) .should.equal(valid);
        validate([ '1',   [ '1', '1' ],     '1' ]) .should.equal(valid);
        validate([ {},    [ {}, {} ],       {} ]) .should.equal(valid);
        validate([ [],    [ [], [] ],       [] ]) .should.equal(valid);
        validate([ true,  [ true, true ],   true ]) .should.equal(valid);
        validate([ false, [ false, false ], false ]) .should.equal(valid);
        validate([ null,  [ null, null ],   null ]) .should.equal(valid);

        validate([ 1, [ 1 ] ]) .should.equal(true);
      };
    }
  });


  describe('in dependencies and sub-dependencies', function() {
    describe('schema = true', function() {
      it('should be valid with any property value', function() {
        ajvs.forEach(test(true, true));
      });
    });

    describe('schema = false', function() {
      it('should be invalid with any property value', function() {
        ajvs.forEach(test(false, false));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var schema = {
          type: 'object',
          dependencies: {
            foo: boolSchema,
            bar: {
              type: 'object',
              dependencies: {
                baz: boolSchema
              }
            }
          }
        };

        var validate = ajv.compile(schema);
        validate({ foo: 1,     bar: 1,     baz: 1 }) .should.equal(valid);
        validate({ foo: '1',   bar: '1',   baz: '1' }) .should.equal(valid);
        validate({ foo: {},    bar: {},    baz: {} }) .should.equal(valid);
        validate({ foo: [],    bar: [],    baz: [] }) .should.equal(valid);
        validate({ foo: true,  bar: true,  baz: true }) .should.equal(valid);
        validate({ foo: false, bar: false, baz: false }) .should.equal(valid);
        validate({ foo: null,  bar: null,  baz: null }) .should.equal(valid);

        validate({ bar: 1, quux: 1 }) .should.equal(true);
      };
    }
  });


  describe('in patternProperties', function () {
    describe('schema = true', function() {
      it('should be valid with any property matching pattern', function() {
        ajvs.forEach(test(true, true));
      });
    });

    describe('schema = false', function() {
      it('should be invalid with any property matching pattern', function() {
        ajvs.forEach(test(false, false));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var schema = {
          type: 'object',
          patternProperties: {
            '^f': boolSchema,
            'r$': {
              type: 'object',
              patternProperties: {
                'z$': boolSchema
              }
            }
          }
        };

        var validate = ajv.compile(schema);
        validate({ foo: 1,     bar: { baz: 1 }}) .should.equal(valid);
        validate({ foo: '1',   bar: { baz: '1' }}) .should.equal(valid);
        validate({ foo: {},    bar: { baz: {} }}) .should.equal(valid);
        validate({ foo: [],    bar: { baz: [] }}) .should.equal(valid);
        validate({ foo: true,  bar: { baz: true }}) .should.equal(valid);
        validate({ foo: false, bar: { baz: false }}) .should.equal(valid);
        validate({ foo: null,  bar: { baz: null }}) .should.equal(valid);

        validate({ bar: { quux: 1 } }) .should.equal(true);
      };
    }
  });


  describe('in propertyNames', function() {
    describe('schema = true', function() {
      it('should be valid with any property', function() {
        ajvs.forEach(test(true, true));
      });
    });

    describe('schema = false', function() {
      it('should be invalid with any property', function() {
        ajvs.forEach(test(false, false));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var schema = {
          type: 'object',
          propertyNames: boolSchema
        };

        var validate = ajv.compile(schema);
        validate({ foo: 1 }) .should.equal(valid);
        validate({ bar: 1 }) .should.equal(valid);

        validate({}) .should.equal(true);
      };
    }
  });


  describe('in contains', function() {
    describe('schema = true', function() {
      it('should be valid with any items', function() {
        ajvs.forEach(test(true, true));
      });
    });

    describe('schema = false', function() {
      it('should be invalid with any items', function() {
        ajvs.forEach(test(false, false));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var schema = {
          type: 'array',
          contains: boolSchema
        };

        var validate = ajv.compile(schema);
        validate([ 1 ]) .should.equal(valid);
        validate([ 'foo' ]) .should.equal(valid);
        validate([ {} ]) .should.equal(valid);
        validate([ [] ]) .should.equal(valid);
        validate([ true ]) .should.equal(valid);
        validate([ false ]) .should.equal(valid);
        validate([ null ]) .should.equal(valid);

        validate([]) .should.equal(false);
      };
    }
  });


  describe('in not', function() {
    describe('schema = true', function() {
      it('should be invalid with any data', function() {
        ajvs.forEach(test(true, false));
      });
    });

    describe('schema = false', function() {
      it('should be valid with any data', function() {
        ajvs.forEach(test(false, true));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var schema = {
          not: boolSchema
        };

        var validate = ajv.compile(schema);
        testSchema(validate, valid);
      };
    }
  });


  describe('in allOf', function() {
    describe('schema = true', function() {
      it('should be valid with any data', function() {
        ajvs.forEach(test(true, true));
      });
    });

    describe('schema = false', function() {
      it('should be invalid with any data', function() {
        ajvs.forEach(test(false, false));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var schema = {
          allOf: [
            false,
            boolSchema
          ]
        };

        var validate = ajv.compile(schema);
        testSchema(validate, false);

        schema = {
          allOf: [
            true,
            boolSchema
          ]
        };

        validate = ajv.compile(schema);
        testSchema(validate, valid);
      };
    }
  });


  describe('in anyOf', function() {
    describe('schema = true', function() {
      it('should be valid with any data', function() {
        ajvs.forEach(test(true, true));
      });
    });

    describe('schema = false', function() {
      it('should be invalid with any data', function() {
        ajvs.forEach(test(false, false));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var schema = {
          anyOf: [
            false,
            boolSchema
          ]
        };

        var validate = ajv.compile(schema);
        testSchema(validate, valid);

        schema = {
          anyOf: [
            true,
            boolSchema
          ]
        };

        validate = ajv.compile(schema);
        testSchema(validate, true);
      };
    }
  });


  describe('in oneOf', function() {
    describe('schema = true', function() {
      it('should be valid with any data', function() {
        ajvs.forEach(test(true, true));
      });
    });

    describe('schema = false', function() {
      it('should be invalid with any data', function() {
        ajvs.forEach(test(false, false));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var schema = {
          oneOf: [
            false,
            boolSchema
          ]
        };

        var validate = ajv.compile(schema);
        testSchema(validate, valid);

        schema = {
          oneOf: [
            true,
            boolSchema
          ]
        };

        validate = ajv.compile(schema);
        testSchema(validate, !valid);
      };
    }
  });


  describe('in $ref', function() {
    describe('schema = true', function() {
      it('should be valid with any data', function() {
        ajvs.forEach(test(true, true));
      });
    });

    describe('schema = false', function() {
      it('should be invalid with any data', function() {
        ajvs.forEach(test(false, false));
      });
    });

    function test(boolSchema, valid) {
      return function (ajv) {
        var schema = {
          $ref: '#/definitions/bool',
          definitions: {
            bool: boolSchema
          }
        };

        var validate = ajv.compile(schema);
        testSchema(validate, valid);
      };
    }
  });


  function testSchema(validate, valid) {
    validate(1) .should.equal(valid);
    validate('foo') .should.equal(valid);
    validate({}) .should.equal(valid);
    validate([]) .should.equal(valid);
    validate(true) .should.equal(valid);
    validate(false) .should.equal(valid);
    validate(null) .should.equal(valid);
  }
});
