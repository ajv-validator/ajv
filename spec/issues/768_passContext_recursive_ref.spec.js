'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #768, fix passContext in recursive $ref', function() {
  var ajv, contexts;

  beforeEach(function() {
    contexts = [];
  });

  describe('passContext = true', function() {
    it('should pass this value as context to custom keyword validation function', function() {
      var validate = getValidate(true);
      var self = {};
      validate.call(self, { bar: 'a', baz: { bar: 'b' } });
      contexts .should.have.length(2);
      contexts.forEach(function(ctx) {
        ctx .should.equal(self);
      });
    });
  });

  describe('passContext = false', function() {
    it('should pass ajv instance as context to custom keyword validation function', function() {
      var validate = getValidate(false);
      validate({ bar: 'a', baz: { bar: 'b' } });
      contexts .should.have.length(2);
      contexts.forEach(function(ctx) {
        ctx .should.equal(ajv);
      });
    });
  });

  describe('ref is fragment and passContext = true', function() {
    it('should pass this value as context to custom keyword validation function', function() {
      var validate = getValidateFragments(true);
      var self = {};
      validate.call(self, { baz: { corge: 'a', quux: { baz: { corge: 'b' } } } });
      contexts .should.have.length(2);
      contexts.forEach(function(ctx) {
        ctx .should.equal(self);
      });
    });
  });

  describe('ref is fragment and passContext = false', function() {
    it('should pass ajv instance as context to custom keyword validation function', function() {
      var validate = getValidateFragments(false);
      validate({ baz: { corge: 'a', quux: { baz: { corge: 'b' } } } });
      contexts .should.have.length(2);
      contexts.forEach(function(ctx) {
        ctx .should.equal(ajv);
      });
    });
  });

  function getValidate(passContext) {
    ajv = new Ajv({ passContext: passContext });
    ajv.addKeyword('testValidate', { validate: storeContext });

    var schema = {
      "$id" : "foo",
      "type": "object",
      "required": ["bar"],
      "properties": {
        "bar": { "testValidate": true },
        "baz": {
          "$ref": "foo"
        }
      }
    };

    return ajv.compile(schema);
  }


  function getValidateFragments(passContext) {
    ajv = new Ajv({ passContext: passContext });
    ajv.addKeyword('testValidate', { validate: storeContext });

    ajv.addSchema({
      "$id" : "foo",
      "definitions": {
        "bar": {
          "properties": {
            "baz": {
              "$ref": "boo"
            }
          }
        }
      }
    });

    ajv.addSchema({
      "$id" : "boo",
      "type": "object",
      "required": ["corge"],
      "properties": {
        "quux": { "$ref": "foo#/definitions/bar" },
        "corge": { "testValidate": true }
      }
    });

    return ajv.compile({ "$ref": "foo#/definitions/bar" });
  }

  function storeContext() {
    contexts.push(this);
    return true;
  }
});
