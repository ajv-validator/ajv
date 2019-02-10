'use strict';

var Ajv = require('../ajv');
var should = require('../chai').should();


describe('issue #388, code clean-up not working', function() {
  it('should remove assignement to rootData if it is not used', function() {
    var ajv = new Ajv;
    var validate = ajv.compile({
      type: 'object',
      properties: {
        foo: { type: 'string' }
      }
    });
    var code = validate.toString();
    code.match(/rootData/g).length .should.equal(1);
  });

  it('should remove assignement to errors if they are not used', function() {
    var ajv = new Ajv;
    var validate = ajv.compile({
      type: 'object'
    });
    var code = validate.toString();
    should.equal(code.match(/[^.]errors|vErrors/g), null);
  });
});
