'use strict';

var Ajv = require('../ajv');
require('../chai').should();

describe('regExp option', function() {
  var re2;
  var re2Available = false;

  before(function() {
    try {
      re2 = require('re2');
      re2.code = 'require("re2")';
      re2Available = true;
    } catch(e) {
      console.log('re2 not available, some tests will be skipped');
    }
  });

  describe('with RE2 engine', function() {
    beforeEach(function() {
      if (!re2Available) this.skip();
    });

    it('should use RE2 for static patterns', function() {
      var ajv = new Ajv({regExp: re2});
      var schema = {type: 'string', pattern: '^[a-z]+$'};
      var validate = ajv.compile(schema);

      validate('abc').should.equal(true);
      validate('ABC').should.equal(false);
      validate('123').should.equal(false);
    });

    it('should use RE2 for $data patterns', function() {
      var ajv = new Ajv({$data: true, regExp: re2});
      var schema = {
        type: 'object',
        properties: {
          pattern: {type: 'string'},
          value: {type: 'string', pattern: {$data: '1/pattern'}}
        }
      };
      var validate = ajv.compile(schema);

      validate({pattern: '^[a-z]+$', value: 'abc'}).should.equal(true);
      validate({pattern: '^[a-z]+$', value: 'ABC'}).should.equal(false);
    });

    it('should prevent ReDoS with RE2 for $data pattern', function() {
      var ajv = new Ajv({$data: true, regExp: re2});
      var schema = {
        type: 'object',
        properties: {
          pattern: {type: 'string'},
          value: {type: 'string', pattern: {$data: '1/pattern'}}
        }
      };
      var validate = ajv.compile(schema);

      // ReDoS attack payload
      var start = Date.now();
      var result = validate({
        pattern: '^(a|a)*$',
        value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' + 'X'
      });
      var elapsed = Date.now() - start;

      result.should.equal(false);
      elapsed.should.be.below(500); // Should complete quickly with RE2
    });

    it('should use RE2 for patternProperties', function() {
      var ajv = new Ajv({regExp: re2});
      var schema = {
        type: 'object',
        patternProperties: {
          '^[a-z]+$': {type: 'number'}
        },
        additionalProperties: false
      };
      var validate = ajv.compile(schema);

      validate({abc: 1, def: 2}).should.equal(true);
      validate({abc: 'not a number'}).should.equal(false);
      validate({ABC: 1}).should.equal(false); // additionalProperties: false
    });
  });

  describe('with default engine', function() {
    it('should use native RegExp by default', function() {
      var ajv = new Ajv();
      var schema = {type: 'string', pattern: '^[a-z]+$'};
      var validate = ajv.compile(schema);

      validate('abc').should.equal(true);
      validate('ABC').should.equal(false);
    });

    it('should use native RegExp for patternProperties by default', function() {
      var ajv = new Ajv();
      var schema = {
        type: 'object',
        patternProperties: {
          '^[a-z]+$': {type: 'number'}
        }
      };
      var validate = ajv.compile(schema);

      validate({abc: 1}).should.equal(true);
      validate({abc: 'string'}).should.equal(false);
    });

    it('should handle invalid $data regex gracefully', function() {
      var ajv = new Ajv({$data: true});
      var schema = {
        type: 'object',
        properties: {
          pattern: {type: 'string'},
          value: {type: 'string', pattern: {$data: '1/pattern'}}
        }
      };
      var validate = ajv.compile(schema);

      // Invalid regex pattern should fail validation, not throw
      var result = validate({pattern: '[invalid', value: 'test'});
      result.should.equal(false);
    });
  });

  describe('with custom engine', function() {
    it('should use custom regExp function', function() {
      var callCount = 0;
      var customRegExp = function(pattern, flags) {
        callCount++;
        return new RegExp(pattern, flags);
      };
      customRegExp.code = 'customRegExp'; // Use custom code to force regExp function usage

      var ajv = new Ajv({regExp: customRegExp});
      var schema = {type: 'string', pattern: '^test$'};
      var validate = ajv.compile(schema);

      validate('test').should.equal(true);
      callCount.should.be.above(0);
    });

    it('should use custom regExp function for $data patterns', function() {
      var callCount = 0;
      var customRegExp = function(pattern, flags) {
        callCount++;
        return new RegExp(pattern, flags);
      };
      customRegExp.code = 'customRegExp';

      var ajv = new Ajv({$data: true, regExp: customRegExp});
      var schema = {
        type: 'object',
        properties: {
          pattern: {type: 'string'},
          value: {type: 'string', pattern: {$data: '1/pattern'}}
        }
      };
      var validate = ajv.compile(schema);

      validate({pattern: '^test$', value: 'test'}).should.equal(true);
      callCount.should.be.above(0);
    });
  });
});
