'use strict';

var Ajv = require('../ajv');
var should = require('../chai').should();


describe('issue #533, throwing missing ref exception with option missingRefs: "ignore"', function() {
  var schema = {
    "type": "object",
    "properties": {
      "foo": {"$ref": "#/definitions/missing"},
      "bar": {"$ref": "#/definitions/missing"}
    }
  };

  it('should pass validation without throwing exception', function() {
    var ajv = new Ajv({missingRefs: 'ignore'});
    var validate = ajv.compile(schema);
    validate({foo: 'anything'}) .should.equal(true);
    validate({foo: 'anything', bar: 'whatever'}) .should.equal(true);
  });

  it('should throw exception during schema compilation with option missingRefs: true', function() {
    var ajv = new Ajv;
    should.throw(function() {
      ajv.compile(schema);
    });
  });
});
