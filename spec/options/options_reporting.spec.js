'use strict';

var Ajv = require('../ajv');
var should = require('../chai').should();


describe('reporting options', function () {
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
});
