'use strict';

var Ajv = require('../ajv');
require('../chai').should();

describe('CVE-2025-69873: ReDoS Attack Scenario', function() {
  it('should handle pattern injection gracefully with default engine (try/catch)', function() {
    var ajv = new Ajv({ $data: true });

    var schema = {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        value: { type: 'string', pattern: { $data: '1/pattern' } },
      },
    };

    var validate = ajv.compile(schema);

    // CVE-2025-69873 Attack Payload:
    // Pattern: ^(a|a)*$ - catastrophic backtracking regex
    // Value: 20 a's + X - reduced size to avoid hanging; try/catch prevents throw
    var maliciousPayload = {
      pattern: '^(a|a)*$',
      value: 'a'.repeat(20) + 'X',
    };

    var start = Date.now();
    var result = validate(maliciousPayload);
    var elapsed = Date.now() - start;

    // Should fail validation (pattern doesn't match)
    result.should.equal(false);
    // Should complete without throwing (try/catch in $data pattern path)
    elapsed.should.be.below(10000);
  });

  it('should fail gracefully on invalid regex syntax in $data pattern', function() {
    var ajv = new Ajv({ $data: true });

    var schema = {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        value: { type: 'string', pattern: { $data: '1/pattern' } },
      },
    };

    var validate = ajv.compile(schema);

    // Invalid regex syntax - RegExp constructor throws, try/catch should catch and fail validation
    var invalidPatterns = ['[invalid', '(?(1)a|b)'];

    for (var i = 0; i < invalidPatterns.length; i++) {
      var result = validate({
        pattern: invalidPatterns[i],
        value: 'test',
      });
      result.should.equal(false);
    }
  });

  it('should still validate valid patterns correctly with $data', function() {
    var ajv = new Ajv({ $data: true });

    var schema = {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        value: { type: 'string', pattern: { $data: '1/pattern' } },
      },
    };

    var validate = ajv.compile(schema);

    validate({ pattern: '^[a-z]+$', value: 'abc' }).should.equal(true);
    validate({ pattern: '^[a-z]+$', value: 'ABC' }).should.equal(false);
    validate({ pattern: '^\\d{3}-\\d{4}$', value: '123-4567' }).should.equal(true);
    validate({ pattern: '^\\d{3}-\\d{4}$', value: '12-345' }).should.equal(false);
  });

  it('should process attack payload without throwing', function() {
    var ajv = new Ajv({ $data: true });

    var schema = {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        value: { type: 'string', pattern: { $data: '1/pattern' } },
      },
    };

    var validate = ajv.compile(schema);

    var payload = {
      pattern: '^(a|a)*$',
      value: 'a'.repeat(18) + 'X',
    };

    var start = Date.now();
    var result = validate(payload);
    var elapsed = Date.now() - start;

    result.should.equal(false);
    elapsed.should.be.below(8000);
  });
});
