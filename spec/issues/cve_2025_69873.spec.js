'use strict';

var Ajv = require('../ajv');
require('../chai').should();

describe('CVE-2025-69873: ReDoS Attack via $data pattern', function() {
  var re2;
  var re2Available = false;

  before(function() {
    try {
      re2 = require('re2');
      re2.code = 'require("re2")';
      re2Available = true;
    } catch(e) {
      console.log('re2 not available, some CVE tests will be skipped');
    }
  });

  describe('with RE2 engine', function() {
    beforeEach(function() {
      if (!re2Available) this.skip();
    });

    it('should prevent ReDoS with catastrophic backtracking pattern', function() {
      var ajv = new Ajv({$data: true, regExp: re2});
      var schema = {
        type: 'object',
        properties: {
          pattern: {type: 'string'},
          value: {type: 'string', pattern: {$data: '1/pattern'}}
        }
      };
      var validate = ajv.compile(schema);

      var start = Date.now();
      var result = validate({
        pattern: '^(a|a)*$',
        value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' + 'X'
      });
      var elapsed = Date.now() - start;

      result.should.equal(false);
      elapsed.should.be.below(500);
    });

    it('should handle multiple ReDoS patterns', function() {
      var ajv = new Ajv({$data: true, regExp: re2});
      var schema = {
        type: 'object',
        properties: {
          pattern: {type: 'string'},
          value: {type: 'string', pattern: {$data: '1/pattern'}}
        }
      };
      var validate = ajv.compile(schema);

      var redosPatterns = [
        '^(a+)+$',
        '^(a|a)*$',
        '^(a|ab)*$',
        '(x+x+)+y',
        '(a*)*b'
      ];

      redosPatterns.forEach(function(pattern) {
        var start = Date.now();
        var result = validate({
          pattern: pattern,
          value: 'aaaaaaaaaaaaaaaaaaaaaaaaa' + 'X'
        });
        var elapsed = Date.now() - start;

        elapsed.should.be.below(500, 'Pattern ' + pattern + ' took too long: ' + elapsed + 'ms');
        result.should.equal(false);
      });
    });

    it('should still validate valid patterns correctly', function() {
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
      validate({pattern: '^\\d{3}-\\d{4}$', value: '123-4567'}).should.equal(true);
      validate({pattern: '^\\d{3}-\\d{4}$', value: '12-345'}).should.equal(false);
    });

    it('should fail gracefully on invalid regex syntax in pattern', function() {
      var ajv = new Ajv({$data: true, regExp: re2});
      var schema = {
        type: 'object',
        properties: {
          pattern: {type: 'string'},
          value: {type: 'string', pattern: {$data: '1/pattern'}}
        }
      };
      var validate = ajv.compile(schema);

      // Invalid regex patterns - should fail validation, not throw
      var result = validate({pattern: '[invalid', value: 'test'});
      result.should.equal(false);
    });

    it('should process attack payload with safe timing', function() {
      var ajv = new Ajv({$data: true, regExp: re2});
      var schema = {
        type: 'object',
        properties: {
          pattern: {type: 'string'},
          value: {type: 'string', pattern: {$data: '1/pattern'}}
        }
      };
      var validate = ajv.compile(schema);

      // Process the exact CVE attack payload
      var payload = {
        pattern: '^(a|a)*$',
        value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' + 'X'
      };

      // With RE2: should complete in < 100ms
      // Without RE2: would hang for 44+ seconds
      var start = Date.now();
      var result = validate(payload);
      var elapsed = Date.now() - start;

      result.should.equal(false);
      elapsed.should.be.below(500);
    });
  });

  describe('with default engine', function() {
    it('should handle invalid regex in $data gracefully', function() {
      var ajv = new Ajv({$data: true});
      var schema = {
        type: 'object',
        properties: {
          pattern: {type: 'string'},
          value: {type: 'string', pattern: {$data: '1/pattern'}}
        }
      };
      var validate = ajv.compile(schema);

      // Invalid regex should fail validation, not throw
      var result = validate({pattern: '[invalid', value: 'test'});
      result.should.equal(false);
    });

    it('should handle $data pattern validation correctly', function() {
      var ajv = new Ajv({$data: true});
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
  });
});
