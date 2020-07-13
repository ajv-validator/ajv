'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #1244: Should skip extendError if "error" option is "full"', function() {
  it('should skip extendError if "error" option is "full"', function() {
    var ajv = new Ajv({
      verbose: true
    });
    ajv.addKeyword("propertyMustBeTrue", {
      // eslint-disable-next-line no-unused-vars
      validate: function v(schema, data, _parentSchema, dataPath) {
        if (data && !data[schema]) {
          v.errors = [{
            keyword: "propertyMustBeTrue",
            dataPath: dataPath + "." + schema,
            data: data[schema]
          }];
          return false;
        }
        return true;
      },
      errors: "full",
      metaSchema: { type: "string" }
    });

    var schema = {
      properties: {
        a: { type: "boolean" },
      },
      propertyMustBeTrue: "a"
    };
    var data = { a: false };

    var validate = ajv.compile(schema);
    validate(data) .should.equal(false);
    validate.errors.length .should.equal(1);
    validate.errors[0].data .should.equal(false);
    validate.errors[0].dataPath .should.equal(".a");
  });
});
