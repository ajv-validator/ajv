'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #1173: properties matched by patternProperties with `undefined` values', function() {
  it('should ignore `undefined` values for properties matched by patternProperties ', function() {
    var schema = {
      type: "object",
      patternProperties: {
        '^pattern.*': false
      }
    };

    var data = {
      patternProp: undefined
    };

    var ajv = new Ajv();
    var validate = ajv.compile(schema);

    var valid = validate(data);
    valid.should.be.true;
  });
});
