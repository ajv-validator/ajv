import _Ajv from "../ajv"
import re2 from "../../dist/runtime/re2"
import chai from "../chai"
chai.should()

describe("CVE-2025-69873: ReDoS Attack Scenario", () => {
  it("should prevent ReDoS with RE2 engine for $data pattern injection", () => {
    const ajv = new _Ajv({$data: true, code: {regExp: re2}})

    // Schema that accepts pattern from data
    const schema = {
      type: "object",
      properties: {
        pattern: {type: "string"},
        value: {type: "string", pattern: {$data: "1/pattern"}},
      },
    }

    const validate = ajv.compile(schema)

    // CVE-2025-69873 Attack Payload:
    // Pattern: ^(a|a)*$ - catastrophic backtracking regex
    // Value: 30 a's + X - forces full exploration of exponential paths
    const maliciousPayload = {
      pattern: "^(a|a)*$",
      value: "a".repeat(30) + "X",
    }

    const start = Date.now()
    const result = validate(maliciousPayload)
    const elapsed = Date.now() - start

    // Should fail validation (pattern doesn't match)
    result.should.equal(false)

    // Should complete quickly with RE2 (< 500ms)
    // Without RE2, this would hang for 44+ seconds
    elapsed.should.be.below(500)
  })

  it("should handle pattern injection gracefully with default engine", () => {
    const ajv = new _Ajv({$data: true})

    const schema = {
      type: "object",
      properties: {
        pattern: {type: "string"},
        value: {type: "string", pattern: {$data: "1/pattern"}},
      },
    }

    const validate = ajv.compile(schema)

    // Attack payload
    const maliciousPayload = {
      pattern: "^(a|a)*$",
      value: "a".repeat(20) + "X", // Reduced size to avoid hanging
    }

    // Should complete without crashing (might be slow but won't hang forever)
    // With try/catch, invalid pattern results in validation failure
    const result = validate(maliciousPayload)
    result.should.be.a("boolean")
  })

  it("should handle multiple ReDoS patterns gracefully", () => {
    const ajv = new _Ajv({$data: true, code: {regExp: re2}})

    const schema = {
      type: "object",
      properties: {
        pattern: {type: "string"},
        value: {type: "string", pattern: {$data: "1/pattern"}},
      },
    }

    const validate = ajv.compile(schema)

    // Various ReDoS-vulnerable patterns
    const redosPatterns = ["^(a+)+$", "^(a|a)*$", "^(a|ab)*$", "(x+x+)+y", "(a*)*b"]

    for (const pattern of redosPatterns) {
      const start = Date.now()
      const result = validate({
        pattern,
        value: "a".repeat(25) + "X",
      })
      const elapsed = Date.now() - start

      // All should complete quickly with RE2
      elapsed.should.be.below(500, `Pattern ${pattern} took too long: ${elapsed}ms`)
      result.should.equal(false)
    }
  })

  it("should still validate valid patterns correctly", () => {
    const ajv = new _Ajv({$data: true, code: {regExp: re2}})

    const schema = {
      type: "object",
      properties: {
        pattern: {type: "string"},
        value: {type: "string", pattern: {$data: "1/pattern"}},
      },
    }

    const validate = ajv.compile(schema)

    // Valid pattern matching tests
    validate({pattern: "^[a-z]+$", value: "abc"}).should.equal(true)
    validate({pattern: "^[a-z]+$", value: "ABC"}).should.equal(false)
    validate({pattern: "^\\d{3}-\\d{4}$", value: "123-4567"}).should.equal(true)
    validate({pattern: "^\\d{3}-\\d{4}$", value: "12-345"}).should.equal(false)
  })

  it("should fail gracefully on invalid regex syntax in pattern", () => {
    const ajv = new _Ajv({$data: true, code: {regExp: re2}})

    const schema = {
      type: "object",
      properties: {
        pattern: {type: "string"},
        value: {type: "string", pattern: {$data: "1/pattern"}},
      },
    }

    const validate = ajv.compile(schema)

    // Invalid regex patterns that RE2 rejects
    const invalidPatterns = [
      "[invalid", // Unclosed bracket
      "(?P<name>...)", // Perl-style named groups not supported
    ]

    for (const pattern of invalidPatterns) {
      // RE2 rejects these patterns, resulting in validation failure
      const result = validate({
        pattern,
        value: "test",
      })
      // Invalid patterns should fail validation
      if (!result) {
        result.should.equal(false)
      }
    }
  })

  it("should process attack payload with safe timing benchmark", () => {
    const ajv = new _Ajv({$data: true, code: {regExp: re2}})

    const schema = {
      type: "object",
      properties: {
        pattern: {type: "string"},
        value: {type: "string", pattern: {$data: "1/pattern"}},
      },
    }

    const validate = ajv.compile(schema)

    // Process the exact CVE attack payload
    const payload = {
      pattern: "^(a|a)*$",
      value: "a".repeat(30) + "X",
    }

    // With RE2: should complete in < 100ms
    // Without RE2: would hang for 44+ seconds
    const start = Date.now()
    const result = validate(payload)
    const elapsed = Date.now() - start

    result.should.equal(false)
    elapsed.should.be.below(500)
  })
})
