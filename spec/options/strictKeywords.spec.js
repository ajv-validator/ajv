'use strict';

var Ajv = require('../ajv');
var should = require('../chai').should();


describe('strictKeywords option', function() {
  describe('strictKeywords = false', function() {
    it('should NOT throw an error or log a warning given an unknown keyword', function() {
      var output = {};
      var ajv = new Ajv({
        strictKeywords: false,
        logger: getLogger(output)
      });
      var schema = {
        properties: {},
        unknownKeyword: 1
      };

      ajv.compile(schema);
      should.not.exist(output.warning);
    });
  });

  describe('strictKeywords = true', function() {
    it('should throw an error given an unknown keyword in the schema root when strictKeywords is true', function() {
      var ajv = new Ajv({strictKeywords: true});
      var schema = {
        properties: {},
        unknownKeyword: 1
      };
      should.throw(function() { ajv.compile(schema); });
    });
  });

  describe('strictKeywords = "log"', function() {
    it('should log a warning given an unknown keyword in the schema root when strictKeywords is "log"', function() {
      var output = {};
      var ajv = new Ajv({
        strictKeywords: 'log',
        logger: getLogger(output)
      });
      var schema = {
        properties: {},
        unknownKeyword: 1
      };
      ajv.compile(schema);
      should.equal(output.warning, 'unknown keyword: unknownKeyword');
    });
  });

  describe('unknown keyword inside schema that has no known keyword in compound keyword', function() {
    it('should throw an error given an unknown keyword when strictKeywords is true', function() {
      var ajv = new Ajv({strictKeywords: true});
      var schema = {
        anyOf: [
          {
            unknownKeyword: 1
          }
        ]
      };
      should.throw(function() { ajv.compile(schema); });
    });
  });

  function getLogger(output) {
    return {
      log: function() {
        throw new Error('log should not be called');
      },
      warn: function(warning) {
        output.warning = warning;
      },
      error: function() {
        throw new Error('error should not be called');
      }
    };
  }
});
