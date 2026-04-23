'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('$data format with Object.prototype property names', function() {
  var validate;

  beforeEach(function() {
    var ajv = new Ajv({ $data: true });
    validate = ajv.compile({
      properties: {
        str: { type: 'string', format: { $data: '1/strFormat' } },
        strFormat: { type: 'string' }
      }
    });
  });

  it('should not throw when format name is an Object.prototype property', function() {
    var protoProps = [
      'hasOwnProperty',
      'toString',
      'valueOf',
      'constructor',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString'
    ];

    protoProps.forEach(function(prop) {
      (function() { validate({ str: 'test', strFormat: prop }); }).should.not.throw();
    });
  });

  it('should fail validation when format name is an Object.prototype property', function() {
    validate({ str: 'test', strFormat: 'hasOwnProperty' }).should.equal(false);
    validate({ str: 'test', strFormat: 'toString' }).should.equal(false);
    validate({ str: 'test', strFormat: 'constructor' }).should.equal(false);
  });
});
