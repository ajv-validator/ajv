'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe.skip('issue #273, schemaPath in error in referenced schema', function() {
  it('should have canonic reference with hash after file name', function() {
    test(new Ajv);
    test(new Ajv({inlineRefs: false}));

    function test(ajv) {
      var schema = {
        "properties": {
          "a": { "$ref": "int" }
        }
      };

      var referencedSchema = {
        "id": "int",
        "type": "integer"
      };

      ajv.addSchema(referencedSchema);
      var validate = ajv.compile(schema);

      validate({ "a": "foo" }) .should.equal(false);
      validate.errors[0].schemaPath .should.equal('int#/type');
    }
  });
});
