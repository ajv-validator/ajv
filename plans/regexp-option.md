# Plan: Add `regExp` Option to Ajv v6

## 1. Problem Statement

CVE-2025-69873 exposes a ReDoS vulnerability in ajv when using `$data` references with the `pattern` keyword. User-controlled patterns can cause catastrophic backtracking with the native `RegExp` engine.

Ajv v8 mitigates this via a configurable `code.regExp` option that allows using RE2 or other safe regex engines. This option is NOT used for `$data` references in v8 until commit `720a23fa`, and does NOT exist at all in v6.

## 2. Solution Summary

Add `opts.regExp` option to ajv v6 that:
- Allows specifying a custom RegExp engine (e.g., RE2)
- Is used for BOTH static patterns AND `$data` reference patterns
- Wraps `$data` pattern execution in try/catch for invalid regex handling
- Defaults to native `RegExp` for backward compatibility

## 3. Technical Design

### 3.1 Interface (JavaScript, no TypeScript)

```javascript
// RegExpEngine: function(pattern, flags) => RegExpLike
// RegExpEngine.code: string - code representation for static patterns

// RegExpLike: object with test(string) => boolean method

// Default engine:
function defaultRegExp(pattern, flags) {
  return new RegExp(pattern, flags);
}
defaultRegExp.code = 'new RegExp';
```

### 3.2 Keywords Using Regex Patterns

| Keyword | File | $data Support | Notes |
|---------|------|---------------|-------|
| `pattern` | `lib/dot/pattern.jst` | YES | Main CVE target |
| `patternProperties` | `lib/dot/properties.jst` | NO | Static patterns only (lines 74, 221) |

No other keywords use regex patterns. The `format` keyword (`lib/dot/format.jst`) checks `instanceof RegExp` but formats are pre-defined, not user-controlled.

### 3.3 Files to Modify

| File | Change |
|------|--------|
| `lib/ajv.js` | Add `regExp` option handling in constructor |
| `lib/ajv.d.ts` | Add `regExp` option type definition |
| `lib/compile/index.js` | Pass `regExp` to runtime, modify `patternCode()` |
| `lib/dot/pattern.jst` | Use `regExp` for both static and `$data` patterns |
| `lib/dot/properties.jst` | No changes needed - uses `it.usePattern()` which calls `patternCode()` |
| `package.json` | Add `re2` as devDependency |
| `README.md` | Document new option |

### 3.4 Detailed Changes

#### 3.4.1 `package.json`

Add `re2` to devDependencies:

```json
"devDependencies": {
  ...
  "re2": "^1.21.4",
  ...
}
```

#### 3.4.2 `lib/ajv.js`

Add after line 68 (`if (opts.serialize === undefined) opts.serialize = stableStringify;`):

```javascript
if (opts.regExp === undefined) {
  opts.regExp = function(pattern, flags) { return new RegExp(pattern, flags); };
  opts.regExp.code = 'new RegExp';
}
```

#### 3.4.3 `lib/ajv.d.ts`

Add after line 205 (`serialize?:`):

```typescript
regExp?: RegExpEngine;
```

Add new interfaces at end of file (before `export = ajv;`):

```typescript
interface RegExpEngine {
  (pattern: string, flags: string): RegExpLike;
  code: string;
}

interface RegExpLike {
  test: (s: string) => boolean;
}
```

#### 3.4.4 `lib/compile/index.js`

**Change 1:** Add `regExp` to `makeValidate` function parameters (line 120-131):

```javascript
var makeValidate = new Function(
  'self',
  'RULES',
  'formats',
  'root',
  'refVal',
  'defaults',
  'customRules',
  'equal',
  'ucs2length',
  'ValidationError',
  'regExp',  // ADD THIS
  sourceCode
);

validate = makeValidate(
  self,
  RULES,
  formats,
  root,
  refVal,
  defaults,
  customRules,
  equal,
  ucs2length,
  ValidationError,
  opts.regExp  // ADD THIS
);
```

**Change 2:** Modify `patternCode()` function (line 361-363):

```javascript
function patternCode(i, patterns) {
  var regExpCode = opts.regExp.code === 'new RegExp'
    ? 'new RegExp'
    : 'regExp';
  return 'var pattern' + i + ' = ' + regExpCode + '(' + util.toQuotedString(patterns[i]) + ', "' + (opts.unicodeRegExp ? 'u' : '') + '");';
}
```

#### 3.4.5 `lib/dot/pattern.jst`

Replace lines 6-12:

```javascript
{{
  var $u = it.opts.unicodeRegExp ? '"u"' : '""';
  var $regExpCode = it.opts.regExp && it.opts.regExp.code !== 'new RegExp' ? 'regExp' : 'new RegExp';
}}

{{? $isData }}
  var {{=$valid}} = true;
  try {
    {{=$valid}} = {{=$regExpCode}}({{=$schemaValue}}, {{=$u}}).test({{=$data}});
  } catch(e) {
    {{=$valid}} = false;
  }
  if ({{# def.$dataNotType:'string' }} !{{=$valid}}) {
{{??}}
  {{
    var $regexp = it.usePattern($schema);
  }}
  if ({{# def.$dataNotType:'string' }} !{{=$regexp}}.test({{=$data}}) ) {
{{?}}
  {{# def.error:'pattern' }}
} {{? $breakOnError }} else { {{?}}
```

#### 3.4.6 `lib/dot/properties.jst`

The `patternProperties` keyword uses `it.usePattern()` which already goes through `patternCode()`. No template changes needed - the `patternCode()` modification in `lib/compile/index.js` handles this automatically.

Lines affected (no changes needed, just verification):
- Line 74: `|| {{= it.usePattern($pProperty) }}.test({{=$key}})`
- Line 221: `if ({{= it.usePattern($pProperty) }}.test({{=$key}})) {`

### 3.5 Runtime Behavior

| Scenario | Static Pattern | $data Pattern |
|----------|---------------|---------------|
| Default (no regExp option) | `new RegExp(pattern, flags)` at compile time | `new RegExp(schemaValue, flags)` at runtime |
| Custom regExp option | `regExp(pattern, flags)` at compile time | `regExp(schemaValue, flags)` at runtime with try/catch |

## 4. Implementation Plan

### Step 1: Add `re2` devDependency
- Add `re2` to `package.json` devDependencies
- Run `npm install`

### Step 2: Modify `lib/ajv.js`
- Add default `regExp` option initialization
- Ensure backward compatibility

### Step 3: Modify `lib/ajv.d.ts`
- Add `regExp` option type
- Add `RegExpEngine` and `RegExpLike` interfaces

### Step 4: Modify `lib/compile/index.js`
- Pass `regExp` function to generated validator
- Update `patternCode()` to use configured engine

### Step 5: Modify `lib/dot/pattern.jst`
- Handle `$data` case with configured engine
- Add try/catch for invalid regex patterns
- Use configured engine code for static patterns

### Step 6: Verify `lib/dot/properties.jst`
- Confirm `patternProperties` uses `it.usePattern()` (no changes needed)
- Test that configured engine is used for `patternProperties`

### Step 7: Regenerate dotjs files
- Run `npm run build` to regenerate `lib/dotjs/pattern.js`

### Step 8: Add tests

### Step 9: Update documentation

## 5. Test Plan

### 5.1 Test File: `spec/options/regExp.spec.js`

```javascript
'use strict';

var Ajv = require('../ajv');
var should = require('../chai').should();

describe('regExp option', function() {

  describe('with RE2 engine', function() {
    var re2;
    try {
      re2 = require('re2');
      re2.code = 'require("re2")';
    } catch(e) {
      console.log('re2 not available, skipping RE2 tests');
      return;
    }

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
        value: 'a'.repeat(30) + 'X'
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
      customRegExp.code = 'new RegExp';

      var ajv = new Ajv({regExp: customRegExp});
      var schema = {type: 'string', pattern: '^test$'};
      var validate = ajv.compile(schema);

      validate('test').should.equal(true);
      callCount.should.be.above(0);
    });
  });
});
```

### 5.2 Test File: `spec/issues/cve_2025_69873.spec.js`

```javascript
'use strict';

var Ajv = require('../ajv');
var should = require('../chai').should();

describe('CVE-2025-69873: ReDoS Attack via $data pattern', function() {

  describe('with RE2 engine', function() {
    var re2;
    before(function() {
      try {
        re2 = require('re2');
        re2.code = 'require("re2")';
      } catch(e) {
        this.skip();
      }
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
        value: 'a'.repeat(30) + 'X'
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
          value: 'a'.repeat(25) + 'X'
        });
        var elapsed = Date.now() - start;

        elapsed.should.be.below(500, 'Pattern ' + pattern + ' took too long');
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
  });
});
```

## 6. Documentation Updates

### 6.1 README.md

Add to Options section:

```markdown
##### regExp

Allows specifying a custom RegExp engine to use for pattern validation. This is useful for mitigating ReDoS attacks by using a safe regex engine like [RE2](https://github.com/uhop/node-re2).

The function must have the signature `(pattern: string, flags: string) => RegExpLike` where `RegExpLike` is an object with a `test(string) => boolean` method. The function must also have a `code` property containing a string representation for code generation.

Example with RE2:
```javascript
var defined = require('re2');
re2.code = 'require("re2")';

var ajv = new Ajv({regExp: re2});
```

Default: Native `RegExp` constructor.
```

### 6.2 Add to defaults object in README.md

```markdown
regExp: function(p, f) { return new RegExp(p, f); }, // RegExp engine
```

## 7. Verification Steps

1. Run existing tests: `npm test`
2. Run new tests: `npm test -- --grep "regExp option"`
3. Run CVE tests: `npm test -- --grep "CVE-2025-69873"`
4. Manual verification with RE2:
   ```javascript
   var Ajv = require('./lib/ajv');
   var re2 = require('re2');
   re2.code = 'require("re2")';

   var ajv = new Ajv({$data: true, regExp: re2});
   var validate = ajv.compile({
     type: 'object',
     properties: {
       pattern: {type: 'string'},
       value: {type: 'string', pattern: {$data: '1/pattern'}}
     }
   });

   console.time('ReDoS test');
   console.log(validate({pattern: '^(a|a)*$', value: 'a'.repeat(30) + 'X'}));
   console.timeEnd('ReDoS test');
   ```

## 8. Backward Compatibility

- Default behavior unchanged (uses native `RegExp`)
- No breaking changes to existing API
- New option is additive

## 9. Security Considerations

- The `$data` pattern execution is now wrapped in try/catch
- Invalid regex patterns result in validation failure, not exceptions
- RE2 engine rejects unsafe patterns, providing ReDoS protection
