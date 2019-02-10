'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('$comment option', function() {
  describe('= true', function() {
    var logCalls, consoleLog;

    beforeEach(function () {
      consoleLog = console.log;
      console.log = log;
    });

    afterEach(function () {
      console.log = consoleLog;
    });

    function log() {
      logCalls.push(Array.prototype.slice.call(arguments));
    }

    it('should log the text from $comment keyword', function() {
      var schema = {
        properties: {
          foo: {$comment: 'property foo'},
          bar: {$comment: 'property bar', type: 'integer'}
        }
      };

      var ajv = new Ajv({$comment: true});
      var fullAjv = new Ajv({allErrors: true, $comment: true});

      [ajv, fullAjv].forEach(function (_ajv) {
        var validate = _ajv.compile(schema);

        test({}, true, []);
        test({foo: 1}, true, [['property foo']]);
        test({foo: 1, bar: 2}, true, [['property foo'], ['property bar']]);
        test({foo: 1, bar: 'baz'}, false, [['property foo'], ['property bar']]);

        function test(data, valid, expectedLogCalls) {
          logCalls = [];
          validate(data) .should.equal(valid);
          logCalls .should.eql(expectedLogCalls);
        }
      });

      console.log = consoleLog;
    });
  });

  describe('function hook', function() {
    var hookCalls;

    function hook() {
      hookCalls.push(Array.prototype.slice.call(arguments));
    }

    it('should pass the text from $comment keyword to the hook', function() {
      var schema = {
        properties: {
          foo: {$comment: 'property foo'},
          bar: {$comment: 'property bar', type: 'integer'}
        }
      };

      var ajv = new Ajv({$comment: hook});
      var fullAjv = new Ajv({allErrors: true, $comment: hook});

      [ajv, fullAjv].forEach(function (_ajv) {
        var validate = _ajv.compile(schema);

        test({}, true, []);
        test({foo: 1}, true, [['property foo', '#/properties/foo/$comment', schema]]);
        test({foo: 1, bar: 2}, true,
          [['property foo', '#/properties/foo/$comment', schema],
           ['property bar', '#/properties/bar/$comment', schema]]);
        test({foo: 1, bar: 'baz'}, false,
          [['property foo', '#/properties/foo/$comment', schema],
           ['property bar', '#/properties/bar/$comment', schema]]);

        function test(data, valid, expectedHookCalls) {
          hookCalls = [];
          validate(data) .should.equal(valid);
          hookCalls .should.eql(expectedHookCalls);
        }
      });
    });
  });
});
