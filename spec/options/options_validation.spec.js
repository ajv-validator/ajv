'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('validation options', function() {
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
});
