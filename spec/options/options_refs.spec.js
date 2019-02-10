'use strict';

var Ajv = require('../ajv');
var should = require('../chai').should();


describe('referenced schema options', function() {
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
});
