'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('removeAdditional option', function() {
  it('should remove all additional properties', function() {
    var ajv = new Ajv({ removeAdditional: 'all' });

    ajv.addSchema({
      $id: '//test/fooBar',
      properties: { foo: { type: 'string' }, bar: { type: 'string' } }
    });

    var object = {
      foo: 'foo', bar: 'bar', baz: 'baz-to-be-removed'
    };

    ajv.validate('//test/fooBar', object).should.equal(true);
    object.should.have.property('foo');
    object.should.have.property('bar');
    object.should.not.have.property('baz');
  });


  it('should remove properties that would error when `additionalProperties = false`', function() {
    var ajv = new Ajv({ removeAdditional: true });

    ajv.addSchema({
      $id: '//test/fooBar',
      properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      additionalProperties: false
    });

    var object = {
      foo: 'foo', bar: 'bar', baz: 'baz-to-be-removed'
    };

    ajv.validate('//test/fooBar', object).should.equal(true);
    object.should.have.property('foo');
    object.should.have.property('bar');
    object.should.not.have.property('baz');
  });


  it('should remove properties that would error when `additionalProperties = false` (many properties, boolean schema)', function() {
    var ajv = new Ajv({removeAdditional: true});

    var schema = {
      properties: {
        obj: {
          additionalProperties: false,
          properties: {
            a: { type: 'string' },
            b: false,
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

    var data = {
      obj: {
        a: 'valid',
        b: 'should not be removed',
        additional: 'will be removed'
      }
    };

    ajv.validate(schema, data) .should.equal(false);
    data .should.eql({
      obj: {
        a: 'valid',
        b: 'should not be removed'
      }
    });
  });


  it('should remove properties that would error when `additionalProperties` is a schema', function() {
    var ajv = new Ajv({ removeAdditional: 'failing' });

    ajv.addSchema({
      $id: '//test/fooBar',
      properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      additionalProperties: { type: 'string' }
    });

    var object = {
      foo: 'foo', bar: 'bar', baz: 'baz-to-be-kept', fizz: 1000
    };

    ajv.validate('//test/fooBar', object).should.equal(true);
    object.should.have.property('foo');
    object.should.have.property('bar');
    object.should.have.property('baz');
    object.should.not.have.property('fizz');

    ajv.addSchema({
      $id: '//test/fooBar2',
      properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      additionalProperties: { type: 'string', pattern: '^to-be-', maxLength: 10 }
    });

    object = {
      foo: 'foo', bar: 'bar', baz: 'to-be-kept', quux: 'to-be-removed', fizz: 1000
    };

    ajv.validate('//test/fooBar2', object).should.equal(true);
    object.should.have.property('foo');
    object.should.have.property('bar');
    object.should.have.property('baz');
    object.should.not.have.property('fizz');
  });
});
