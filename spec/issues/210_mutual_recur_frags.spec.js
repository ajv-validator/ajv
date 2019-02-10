'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #210, mutual recursive $refs that are schema fragments', function() {
  it('should compile and validate schema when one ref is fragment', function() {
    var ajv = new Ajv;

    ajv.addSchema({
      "$id" : "foo",
      "definitions": {
        "bar": {
          "properties": {
            "baz": {
              "anyOf": [
                { "enum": [42] },
                { "$ref": "boo" }
              ]
            }
          }
        }
      }
    });

    ajv.addSchema({
      "$id" : "boo",
      "type": "object",
      "required": ["quux"],
      "properties": {
        "quux": { "$ref": "foo#/definitions/bar" }
      }
    });

    var validate = ajv.compile({ "$ref": "foo#/definitions/bar" });

    validate({ baz: { quux: { baz: 42 } } }) .should.equal(true);
    validate({ baz: { quux: { baz: "foo" } } }) .should.equal(false);
  });

  it('should compile and validate schema when both refs are fragments', function() {
    var ajv = new Ajv;

    ajv.addSchema({
      "$id" : "foo",
      "definitions": {
        "bar": {
          "properties": {
            "baz": {
              "anyOf": [
                { "enum": [42] },
                { "$ref": "boo#/definitions/buu" }
              ]
            }
          }
        }
      }
    });

    ajv.addSchema({
      "$id" : "boo",
      "definitions": {
        "buu": {
          "type": "object",
          "required": ["quux"],
          "properties": {
            "quux": { "$ref": "foo#/definitions/bar" }
          }
        }
      }
    });

    var validate = ajv.compile({ "$ref": "foo#/definitions/bar" });

    validate({ baz: { quux: { baz: 42 } } }) .should.equal(true);
    validate({ baz: { quux: { baz: "foo" } } }) .should.equal(false);
  });
});
