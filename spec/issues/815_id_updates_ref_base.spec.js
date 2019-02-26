'use strict';

var Ajv = require('../ajv');
require('../chai').should();

describe.only('issue #815, id and $id fields should reset base', function() {
  var schema = {
    "type": "object",
    "properties": {
      "newRoot": {
        "$id": "http://example.com/newRoot",
        "properties": {
          "recurse": {
            "$ref": "#"
          },
          "name": {
            "type": "string"
          }
        },
        "required": ["name"],
        "additionalProperties": false
      }
    },
    "required": ["newRoot"],
    "additionalProperties": false
  };

  var ajv = new Ajv();
  var validate = ajv.compile(schema);

  it('should set # to reference the closest ancestor with $id', function() {
    validate({newRoot: {
      name: 'test'
    }}) .should.equal(true);

    validate({newRoot: {
      name: 'test',
      recurse: {
        name: 'test2'
      }
    }}) .should.equal(true);
  });

  it('should NOT set # to reference the absolute document root', function() {
    validate({newRoot: {
      name: 'test',
      recurse: {
        newRoot: {
          name: 'test2'
        }
      }
    }}) .should.equal(false);
  });
});
