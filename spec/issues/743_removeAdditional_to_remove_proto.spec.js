'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #743, property __proto__ should be removed with removeAdditional option', function() {
  it('should remove additional properties', function() {
    var ajv = new Ajv({removeAdditional: true});

    var schema = {
      properties: {
        obj: {
          additionalProperties: false,
          properties: {
            a: { type: 'string' },
            b: { type: 'string' },
            c: { type: 'string' },
            d: { type: 'string' },
            e: { type: 'string' },
            f: { type: 'string' },
            g: { type: 'string' },
            h: { type: 'string' },
            i: { type: 'string' }
          }
        }
      }
    };

    var obj= Object.create(null);
    obj.__proto__ = null; // should be removed
    obj.additional = 'will be removed';
    obj.a = 'valid';
    obj.b = 'valid';

    var data = {obj: obj};

    ajv.validate(schema, data) .should.equal(true);
    Object.keys(data.obj) .should.eql(['a', 'b']);
  });
});
