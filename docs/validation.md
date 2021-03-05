# Data validation

[[toc]]

## JSON Schema draft-2019-09

The default export of Ajv provides support of JSON-Schema draft-07, without any of draft-2019-09 features:

```javascript
import Ajv from "ajv"
// const Ajv = require("ajv").default
const ajv = new Ajv()
```

To use Ajv with the support of all JSON Schema draft-2019-09 features you need to use a different export:

```javascript
import Ajv from "ajv/dist/2019"
// const Ajv2019 = require("ajv/dist/2019").default
const ajv = new Ajv2019()
```

Optionally, you can add draft-07 meta-schema, to use both draft-07 and draft-2019-09 schemas in one Ajv instance:

```javascript
const draft7MetaSchema = require("ajv/dist/refs/json-schema-draft-07.json")
ajv.addMetaSchema(draft7MetaSchema)
```

Draft-2019-09 support is provided via a separate export in order to avoid increasing the bundle and generated code size for draft-07 users.

With this import Ajv supports the following features:

- keywords [`unevaluatedProperties`](./json-schema.md#unevaluatedproperties) and [`unevaluatedItems`](./json-schema.md#unevaluateditems)
- keywords [`dependentRequired`](./json-schema.md#dependentrequired), [`dependentSchemas`](./json-schema.md#dependentschemas), [`maxContains`/`minContain`](./json-schema.md#maxcontains--mincontains)
- dynamic recursive references with [`recursiveAnchor`/`recursiveReference`] - see [Extending recursive schemas](#extending-recursive-schemas)
- draft-2019-09 meta-schema is the default.

::: warning Please note
Supporting dynamic recursive references and `unevaluatedProperties/Items` adds additional generated code even to the validation functions where these features are not used (when possible, Ajv determines which properties/items are "unevaluated" at compilation time, but support for dynamic references always adds additional generated code). If you are not using these features in your schemas it is recommended to use default Ajv export with JSON-Schema draft-07 support.
:::

You can also use individual draft-2019-09 features to Ajv with the advanced options `dynamicRef`, `next` and `unevaluated`. These options are changing how the code is generated for draft-07 keywords to support the new features of draft-2019-09, but they do not add the new keywords - they should be added separately. The code examples below shows how to enable individual draft-2019-09 features:

```javascript
import Ajv from "ajv"
// const Ajv = require("ajv").default

// add support for unevaluatedProperties and unevaluatedItems without other 2019-09 features
const ajv = new Ajv({unevaluated: true})
import unevaluatedVocabulary from "ajv/dist/vocabularies/unevaluated"
// const unevaluatedVocabulary = require("ajv/dist/vocabularies/unevaluated").default
ajv.addVocabulary(unevaluatedVocabulary)

// add support for dependentRequired, dependentSchemas, maxContains and minContains
const ajv = new Ajv({next: true})
import nextVocabulary from "ajv/dist/vocabularies/next"
// const nextVocabulary = require("ajv/dist/vocabularies/next").default
ajv.addVocabulary(nextVocabulary)

// add support for dynamic recursive references
const ajv = new Ajv({dynamicRef: true})
import dynamicVocabulary from "ajv/dist/vocabularies/dynamic"
// const dynamicVocabulary = require("ajv/dist/vocabularies/dynamic").default
ajv.addVocabulary(dynamicVocabulary)
```

If you want to have support of all these features you should import Ajv from `"ajv/dist/2019"` as shown above.

## Validation basics

### JSON Schema validation keywords

Ajv supports all validation keywords from draft-07 of JSON Schema standard - see [JSON Schema validation keywords](./json-schema.md) for more details.

[ajv-keywords](https://github.com/ajv-validator/ajv-keywords) package provides additional validation keywords that can be used with Ajv.

### Formats

From version 7 Ajv does not include formats defined by JSON Schema specification - these and several other formats are provided by [ajv-formats](https://github.com/ajv-validator/ajv-formats) plugin.

To add all formats from this plugin:

```javascript
import Ajv from "ajv"
import addFormats from "ajv-formats"

const ajv = new Ajv()
addFormats(ajv)
```

See ajv-formats documentation for further details.

It is recommended NOT to use "format" keyword implementations with untrusted data, as they may use potentially unsafe regular expressions (even though known issues are fixed) - see [ReDoS attack](./security.md#redos-attack).

::: danger Please note
If you need to use "format" keyword to validate untrusted data, you MUST assess their suitability and safety for your validation scenarios.
:::

The following formats are defined in [ajv-formats](https://github.com/ajv-validator/ajv-formats) for string validation with "format" keyword:

- _date_: full-date according to [RFC3339](http://tools.ietf.org/html/rfc3339#section-5.6).
- _time_: time with optional time-zone.
- _date-time_: date-time from the same source (time-zone is mandatory).
- _duration_: duration from [RFC3339](https://tools.ietf.org/html/rfc3339#appendix-A)
- _uri_: full URI.
- _uri-reference_: URI reference, including full and relative URIs.
- _uri-template_: URI template according to [RFC6570](https://datatracker.ietf.org/doc/rfc6570/)
- _url_ (deprecated): [URL record](https://url.spec.whatwg.org/#concept-url).
- _email_: email address.
- _hostname_: host name according to [RFC1034](http://tools.ietf.org/html/rfc1034#section-3.5).
- _ipv4_: IP address v4.
- _ipv6_: IP address v6.
- _regex_: tests whether a string is a valid regular expression by passing it to RegExp constructor.
- _uuid_: Universally Unique Identifier according to [RFC4122](https://datatracker.ietf.org/doc/rfc4122/).
- _json-pointer_: JSON-pointer according to [RFC6901](https://datatracker.ietf.org/doc/rfc6901/).
- _relative-json-pointer_: relative JSON-pointer according to [this draft](http://tools.ietf.org/html/draft-luff-relative-json-pointer-00).

::: warning Please note
JSON Schema draft-07 also defines formats `iri`, `iri-reference`, `idn-hostname` and `idn-email` for URLs, hostnames and emails with international characters. These formats are available in [ajv-formats-draft2019](https://github.com/luzlab/ajv-formats-draft2019) plugin.
:::

You can add and replace any formats using [addFormat](./api.md#api-addformat) method.

## Asynchronous validation

Example in Node.js REPL: https://runkit.com/esp/ajv-asynchronous-validation

You can define formats and keywords that perform validation asynchronously by accessing database or some other service. You should add `async: true` in the keyword or format definition (see [addFormat](./api.md#api-addformat), [addKeyword](./api.md#api-addkeyword) and [User-defined keywords](./keywords.md)).

If your schema uses asynchronous formats/keywords or refers to some schema that contains them it should have `"$async": true` keyword so that Ajv can compile it correctly. If asynchronous format/keyword or reference to asynchronous schema is used in the schema without `$async` keyword Ajv will throw an exception during schema compilation.

::: warning Please note
All asynchronous subschemas that are referenced from the current or other schemas should have `"$async": true` keyword as well, otherwise the schema compilation will fail.
:::

Validation function for an asynchronous format/keyword should return a promise that resolves with `true` or `false` (or rejects with `new Ajv.ValidationError(errors)` if you want to return errors from the keyword function).

Ajv compiles asynchronous schemas to [async functions](http://tc39.github.io/ecmascript-asyncawait/). Async functions are supported in Node.js 7+ and all modern browsers. You can supply a transpiler as a function via `processCode` option. See [Options](./api.md#options).

The compiled validation function has `$async: true` property (if the schema is asynchronous), so you can differentiate these functions if you are using both synchronous and asynchronous schemas.

Validation result will be a promise that resolves with validated data or rejects with an exception `Ajv.ValidationError` that contains the array of validation errors in `errors` property.

Example:

```javascript
const ajv = new Ajv()

ajv.addKeyword({
  keyword: "idExists"
  async: true,
  type: "number",
  validate: checkIdExists,
})

function checkIdExists(schema, data) {
  return knex(schema.table)
    .select("id")
    .where("id", data)
    .then(function (rows) {
      return !!rows.length // true if record is found
    })
}

const schema = {
  $async: true,
  properties: {
    userId: {
      type: "integer",
      idExists: {table: "users"},
    },
    postId: {
      type: "integer",
      idExists: {table: "posts"},
    },
  },
}

const validate = ajv.compile(schema)

validate({userId: 1, postId: 19})
  .then(function (data) {
    console.log("Data is valid", data) // { userId: 1, postId: 19 }
  })
  .catch(function (err) {
    if (!(err instanceof Ajv.ValidationError)) throw err
    // data is invalid
    console.log("Validation errors:", err.errors)
  })
```

### Using transpilers

```javascript
const ajv = new Ajv({processCode: transpileFunc})
const validate = ajv.compile(schema) // transpiled es7 async function
validate(data).then(successFunc).catch(errorFunc)
```

See [Options](./api.md#options).

## Modifying data during validation

### Removing additional properties

With [option `removeAdditional`](./api.md#options) (added by [andyscott](https://github.com/andyscott)) you can filter data during the validation.

This option modifies original data.

Example:

```javascript
const ajv = new Ajv({removeAdditional: true})
const schema = {
  additionalProperties: false,
  properties: {
    foo: {type: "number"},
    bar: {
      additionalProperties: {type: "number"},
      properties: {
        baz: {type: "string"},
      },
    },
  },
}

const data = {
  foo: 0,
  additional1: 1, // will be removed; `additionalProperties` == false
  bar: {
    baz: "abc",
    additional2: 2, // will NOT be removed; `additionalProperties` != false
  },
}

const validate = ajv.compile(schema)

console.log(validate(data)) // true
console.log(data) // { "foo": 0, "bar": { "baz": "abc", "additional2": 2 }
```

If `removeAdditional` option in the example above were `"all"` then both `additional1` and `additional2` properties would have been removed.

If the option were `"failing"` then property `additional1` would have been removed regardless of its value and property `additional2` would have been removed only if its value were failing the schema in the inner `additionalProperties` (so in the example above it would have stayed because it passes the schema, but any non-number would have been removed).

::: warning Please note
If you use `removeAdditional` option with `additionalProperties` keyword inside `anyOf`/`oneOf` keywords your validation can fail with this schema
:::

For example:

```javascript
{
  type: "object",
  oneOf: [
    {
      properties: {
        foo: {type: "string"}
      },
      required: ["foo"],
      additionalProperties: false
    },
    {
      properties: {
        bar: {type: "integer"}
      },
      required: ["bar"],
      additionalProperties: false
    }
  ]
}
```

The intention of the schema above is to allow objects with either the string property "foo" or the integer property "bar", but not with both and not with any other properties.

With the option `removeAdditional: true` the validation will pass for the object `{ "foo": "abc"}` but will fail for the object `{"bar": 1}`. It happens because while the first subschema in `oneOf` is validated, the property `bar` is removed because it is an additional property according to the standard (because it is not included in `properties` keyword in the same schema).

While this behaviour is unexpected (issues [#129](https://github.com/ajv-validator/ajv/issues/129), [#134](https://github.com/ajv-validator/ajv/issues/134)), it is correct. To have the expected behaviour (both objects are allowed and additional properties are removed) the schema has to be refactored in this way:

```javascript
{
  type: "object",
  properties: {
    foo: {type: "string"},
    bar: {type: "integer"}
  },
  additionalProperties: false,
  oneOf: [{required: ["foo"]}, {required: ["bar"]}]
}
```

The schema above is also more efficient - it will compile into a faster function.

### Assigning defaults

With [option `useDefaults`](./api.md#options) Ajv will assign values from `default` keyword in the schemas of `properties` and `items` (when it is the array of schemas) to the missing properties and items.

With the option value `"empty"` properties and items equal to `null` or `""` (empty string) will be considered missing and assigned defaults.

This option modifies original data.

::: warning Please note
The default value is inserted in the generated validation code as a literal, so the value inserted in the data will be the deep clone of the default in the schema.
:::

Example 1 (`default` in `properties`):

```javascript
const ajv = new Ajv({useDefaults: true})
const schema = {
  type: "object",
  properties: {
    foo: {type: "number"},
    bar: {type: "string", default: "baz"},
  },
  required: ["foo", "bar"],
}

const data = {foo: 1}

const validate = ajv.compile(schema)

console.log(validate(data)) // true
console.log(data) // { "foo": 1, "bar": "baz" }
```

Example 2 (`default` in `items`):

```javascript
const schema = {
  type: "array",
  items: [{type: "number"}, {type: "string", default: "foo"}],
}

const data = [1]

const validate = ajv.compile(schema)

console.log(validate(data)) // true
console.log(data) // [ 1, "foo" ]
```

With `useDefaults` option `default` keywords throws exception during schema compilation when used in:

- not in `properties` or `items` subschemas
- in schemas inside `anyOf`, `oneOf` and `not` (see [#42](https://github.com/ajv-validator/ajv/issues/42))
- in `if` schema
- in schemas generated by user-defined _macro_ keywords

The strict mode option can change the behaviour for these unsupported defaults (`strict: false` to ignore them, `"log"` to log a warning).

See [Strict mode](./strict-mode.md).

### Coercing data types

When you are validating user inputs all your data properties are usually strings. The option `coerceTypes` allows you to have your data types coerced to the types specified in your schema `type` keywords, both to pass the validation and to use the correctly typed data afterwards.

This option modifies original data.

::: warning Please note
If you pass a scalar value to the validating function its type will be coerced and it will pass the validation, but the value of the variable you pass won't be updated because scalars are passed by value.
:::

Example 1:

```javascript
const ajv = new Ajv({coerceTypes: true})
const schema = {
  type: "object",
  properties: {
    foo: {type: "number"},
    bar: {type: "boolean"},
  },
  required: ["foo", "bar"],
}

const data = {foo: "1", bar: "false"}

const validate = ajv.compile(schema)

console.log(validate(data)) // true
console.log(data) // { "foo": 1, "bar": false }
```

Example 2 (array coercions):

```javascript
const ajv = new Ajv({coerceTypes: "array"})
const schema = {
  properties: {
    foo: {type: "array", items: {type: "number"}},
    bar: {type: "boolean"},
  },
}

const data = {foo: "1", bar: ["false"]}

const validate = ajv.compile(schema)

console.log(validate(data)) // true
console.log(data) // { "foo": [1], "bar": false }
```

The coercion rules, as you can see from the example, are different from JavaScript both to validate user input as expected and to have the coercion reversible (to correctly validate cases where different types are defined in subschemas of "anyOf" and other compound keywords).

See [Coercion rules](./coercion.md) for details.
