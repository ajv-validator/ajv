# Security considerations

JSON Schema, if properly used, can replace data sanitisation. It doesn't replace other API security considerations. It also introduces additional security aspects to consider.

[[toc]]

## Security contact

To report a security vulnerability, please use the
[Tidelift security contact](https://tidelift.com/security).
Tidelift will coordinate the fix and disclosure. Please do NOT report security vulnerabilities via GitHub issues.

## Untrusted schemas

Ajv treats JSON schemas as trusted as your application code. This security model is based on the most common use case, when the schemas are static and bundled together with the application.

If your schemas are received from untrusted sources (or generated from untrusted data) there are several scenarios you need to prevent:

- compiling schemas can cause stack overflow (if they are too deep)
- compiling schemas can be slow (e.g. [#557](https://github.com/ajv-validator/ajv/issues/557))
- validating certain data can be slow

It is difficult to predict all the scenarios, but at the very least it may help to limit the size of untrusted schemas (e.g. limit JSON string length) and also the maximum schema object depth (that can be high for relatively small JSON strings). You also may want to mitigate slow regular expressions in `pattern` and `patternProperties` keywords.

Regardless the measures you take, using untrusted schemas increases security risks.

## Circular references in JavaScript objects

Ajv does not support schemas and validated data that have circular references in objects. See [issue #802](https://github.com/ajv-validator/ajv/issues/802).

An attempt to compile such schemas or validate such data would cause stack overflow (or will not complete in case of asynchronous validation). Depending on the parser you use, untrusted data can lead to circular references.

## Security risks of trusted schemas

Some keywords in JSON Schemas can lead to very slow validation for certain data. These keywords include (but may be not limited to):

- `pattern` and `format` for large strings - in some cases using `maxLength` can help mitigate it, but certain regular expressions can lead to exponential validation time even with relatively short strings (see [ReDoS attack](#redos-attack)).
- `patternProperties` for large property names - use `propertyNames` to mitigate, but some regular expressions can have exponential evaluation time as well.
- `uniqueItems` for large non-scalar arrays - use `maxItems` to mitigate

::: danger Please note
The suggestions above to prevent slow validation would only work if you do NOT use `allErrors: true` in production code (using it would continue validation after validation errors).
:::

You can validate your JSON schemas against [this meta-schema](https://github.com/ajv-validator/ajv/blob/master/lib/refs/json-schema-secure.json) to check that these recommendations are followed:

```javascript
ajv = new Ajv({strictTypes: false}) // this option is required for this schema
const isSchemaSecure = ajv.compile(require("ajv/lib/refs/json-schema-secure.json"))

const schema1 = {format: "email"}
isSchemaSecure(schema1) // false

const schema2 = {format: "email", maxLength: MAX_LENGTH}
isSchemaSecure(schema2) // true
```

::: danger Please note
Following all these recommendation is not a guarantee that validation using of untrusted data is safe - it can still lead to some undesirable results.
:::

## ReDoS attack

Certain regular expressions can lead to the exponential evaluation time even with relatively short strings.

Please assess the regular expressions you use in the schemas on their vulnerability to this attack - see [safe-regex](https://github.com/substack/safe-regex), for example.

::: warning Please note
Some formats that [ajv-formats](https://github.com/ajv-validator/ajv-formats) package implements use [regular expressions](https://github.com/ajv-validator/ajv-formats/blob/master/src/formats.ts) that can be vulnerable to ReDoS attack.
:::

If you use Ajv to validate data from untrusted sources **it is strongly recommended** to consider the following:

- making assessment of "format" implementations in [ajv-formats](https://github.com/ajv-validator/ajv-formats).
- passing `"fast"` option to ajv-formats plugin (see its docs) that simplifies some of the regular expressions (although it does not guarantee that they are safe).
- replacing format implementations provided by ajv-formats with your own implementations of "format" keyword that either use different regular expressions or another approach to format validation. Please see [addFormat](#api-addformat) method.
- disabling format validation by ignoring "format" keyword with option `format: false`

Whatever mitigation you choose, please assume all formats provided by ajv-formats as potentially unsafe and make your own assessment of their suitability for your validation scenarios.

## Content Security Policy

When using Ajv in a browser page with enabled Content Security Policy (CSP), `script-src` directive must include `'unsafe-eval'`.

::: warning Please note
`unsafe-eval` is NOT recommended in a secure CSP[[1]](https://developer.chrome.com/extensions/contentSecurityPolicy#relaxing-eval), as it has the potential to open the document to cross-site scripting (XSS) attacks.
:::

In order to use Ajv without relaxing CSP, you can [compile the schemas using CLI](https://github.com/ajv-validator/ajv-cli#compile-schemas) or programmatically in your build code - see [Standalone validation code](./standalone.md). Compiled JavaScript file can export one or several validation functions that have the same code as the schemas compiled at runtime.
