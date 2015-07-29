'use strict';

var Ajv = require(typeof window == 'object' ? 'ajv' : '../lib/ajv')
  , should = require('chai').should()
  , stableStringify = require('json-stable-stringify');

describe('Ajv Options', function () {

  describe('removeAdditional', function() {
    it('should remove properties that would error when `additionalProperties = false`', function() {
      var ajv = Ajv({ removeAdditional: true });

      ajv.compile({
        id: '//test/fooBar',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
        additionalProperties: false
      });

      var object = {
        foo: 'foo', bar: 'bar', baz: 'baz-to-be-removed'
      };

      ajv.validate('//test/fooBar', object) .should.equal(true);
      object.should.have.all.keys(['foo', 'bar']);
      object.should.not.have.property('baz');

    });

  });

});
