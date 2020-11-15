# Data validation

- [Data validation](#data-validation)
  - [JSON Schema draft-2019-09](#json-schema-draft-2019-09)
  - [Validation basics](#validation-basics)
    - [JSON Schema validation keywords](#json-schema-validation-keywords)
    - [Annotation keywords](#annotation-keywords)
    - [Formats](#formats)
  - [Modular schemas](#modular-schemas)
    - [<a name="ref"></a>Combining schemas with \$ref](#combining-schemas-with-ref)
    - [Extending recursive schemas](#extending-recursive-schemas)
    - [\$data reference](#data-reference)
    - [$merge and $patch keywords](#merge-and-patch-keywords)
  - [User-defined keywords](#user-defined-keywords)
  - [Asynchronous schema compilation](#asynchronous-schema-compilation)
  - [Asynchronous validation](#asynchronous-validation)
    - [Using transpilers](#using-transpilers)
  - [Modifying data during validation](#modifying-data-during-validation)
    - [Removing additional properties](#removing-additional-properties)
    - [Assigning defaults](#assigning-defaults)
    - [Coercing data types](#coercing-data-types)

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

**Please note**: Supporting dynamic recursive references and `unevaluatedProperties/Items` adds additional generated code even to the validation functions where these features are not used (when possible, Ajv determines which properties/items are "unevaluated" at compilation time, but support for dynamic references always adds additional generated code). If you are not using these features in your schemas it is recommended to use default Ajv export with JSON-Schema draft-07 support.

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

### Metadata keywords

JSON Schema specification defines several metadata keywords that describe the schema itself but do not perform any validation.

- `title` and `description`: information about the data represented by that schema
- `$comment` (NEW in draft-07): information for developers. With option `$comment` Ajv logs or passes the comment string to the user-supplied function. See [Options](./api.md#options).
- `default`: a default value of the data instance, see [Assigning defaults](#assigning-defaults).
- `examples` (NEW in draft-06): an array of data instances. Ajv does not check the validity of these instances against the schema.
- `readOnly` and `writeOnly` (NEW in draft-07): marks data-instance as read-only or write-only in relation to the source of the data (database, api, etc.).
- `contentEncoding`: [RFC 2045](https://tools.ietf.org/html/rfc2045#section-6.1), e.g., "base64".
- `contentMediaType`: [RFC 2046](https://tools.ietf.org/html/rfc2046), e.g., "image/png".

**Please note**: Ajv does not implement validation of the keywords `examples`, `contentEncoding` and `contentMediaType` but it reserves them. If you want to create a plugin that implements any of them, it should remove these keywords from the instance.

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

**Please note**: if you need to use "format" keyword to validate untrusted data, you MUST assess their suitability and safety for your validation scenarios.

The following formats are defined in [ajv-formats](https://github.com/ajv-validator/ajv-formats) for string validation with "format" keyword:

- _date_: full-date according to [RFC3339](http://tools.ietf.org/html/rfc3339#section-5.6).
- _time_: time with optional time-zone.
- _date-time_: date-time from the same source (time-zone is mandatory).
- _duration_: duration from [RFC3339](https://tools.ietf.org/html/rfc3339#appendix-A)
- _uri_: full URI.
- _uri-reference_: URI reference, including full and relative URIs.
- _uri-template_: URI template according to [RFC6570](https://tools.ietf.org/html/rfc6570)
- _url_ (deprecated): [URL record](https://url.spec.whatwg.org/#concept-url).
- _email_: email address.
- _hostname_: host name according to [RFC1034](http://tools.ietf.org/html/rfc1034#section-3.5).
- _ipv4_: IP address v4.
- _ipv6_: IP address v6.
- _regex_: tests whether a string is a valid regular expression by passing it to RegExp constructor.
- _uuid_: Universally Unique IDentifier according to [RFC4122](http://tools.ietf.org/html/rfc4122).
- _json-pointer_: JSON-pointer according to [RFC6901](https://tools.ietf.org/html/rfc6901).
- _relative-json-pointer_: relative JSON-pointer according to [this draft](http://tools.ietf.org/html/draft-luff-relative-json-pointer-00).

**Please note**: JSON Schema draft-07 also defines formats `iri`, `iri-reference`, `idn-hostname` and `idn-email` for URLs, hostnames and emails with international characters. These formats are available in [ajv-formats-draft2019](https://github.com/luzlab/ajv-formats-draft2019) plugin.

You can add and replace any formats using [addFormat](./api.md#api-addformat) method.

## Modular schemas

### <a name="ref"></a>Combining schemas with \$ref

You can structure your validation logic across multiple schema files and have schemas reference each other using `$ref` keyword.

Example:

```javascript
const schema = {
  $id: "http://example.com/schemas/schema.json",
  type: "object",
  properties: {
    foo: {$ref: "defs.json#/definitions/int"},
    bar: {$ref: "defs.json#/definitions/str"},
  },
}

const defsSchema = {
  $id: "http://example.com/schemas/defs.json",
  definitions: {
    int: {type: "integer"},
    str: {type: "string"},
  },
}
```

Now to compile your schema you can either pass all schemas to Ajv instance:

```javascript
const ajv = new Ajv({schemas: [schema, defsSchema]})
const validate = ajv.getSchema("http://example.com/schemas/schema.json")
```

or use `addSchema` method:

```javascript
const ajv = new Ajv()
const validate = ajv.addSchema(defsSchema).compile(schema)
```

See [Options](./api.md#options) and [addSchema](./api.md#add-schema) method.

**Please note**:

- `$ref` is resolved as the uri-reference using schema \$id as the base URI (see the example).
- References can be recursive (and mutually recursive) to implement the schemas for different data structures (such as linked lists, trees, graphs, etc.).
- You don't have to host your schema files at the URIs that you use as schema \$id. These URIs are only used to identify the schemas, and according to JSON Schema specification validators should not expect to be able to download the schemas from these URIs.
- The actual location of the schema file in the file system is not used.
- You can pass the identifier of the schema as the second parameter of `addSchema` method or as a property name in `schemas` option. This identifier can be used instead of (or in addition to) schema \$id.
- You cannot have the same \$id (or the schema identifier) used for more than one schema - the exception will be thrown.
- You can implement dynamic resolution of the referenced schemas using `compileAsync` method. In this way you can store schemas in any system (files, web, database, etc.) and reference them without explicitly adding to Ajv instance. See [Asynchronous schema compilation](./validation.md#asynchronous-schema-compilation).

### Extending recursive schemas

While statically defined `$ref` keyword allows to split schemas to multiple files, it is difficult to extend recursive schemas - the recursive reference(s) in the original schema points to the original schema, and not to the extended one. So in JSON Schema draft-07 the only available solution to extend the recursive schema was to redefine all sections of the original schema that have recursion.

It was particularly repetitive when extending meta-schema, as it has many recursive references, but even in a schema with a single recursive reference extending it was very verbose.

JSON Schema draft-2019-09 and the upcoming draft defined the mechanism for dynamic recursion using keywords `$recursiveRef`/`$recursiveAnchor` (draft-2019-09) or `$dynamicRef`/`$dynamicAnchor` (the next JSON Schema draft) that is somewhat similar to "open recursion" in functional programming.

Consider this recursive schema with static recursion:

```javascript
const treeSchema = {
  $id: "https://example.com/tree",
  type: "object",
  required: ["data"],
  properties: {
    data: true,
    children: {
      type: "array",
      items: {$ref: "#"},
    },
  },
}
```

The only way to extend this schema to prohibit additional properties is by adding `additionalProperties` keyword right in the schema - this approach can be impossible if you do not control the source of the original schema. Ajv also provided the additional keywords in [ajv-merge-patch](https://github.com/ajv-validator/ajv-merge-patch) package to extend schemas by treating them as plain JSON data. While this approach may work for you, it is non-standard and therefore not portable.

The new keywords for dynamic recursive references allow extending this schema without modifying it:

```javascript
const treeSchema = {
  $id: "https://example.com/tree",
  $recursiveAnchor: true,
  type: "object",
  required: ["data"],
  properties: {
    data: true,
    children: {
      type: "array",
      items: {$recursiveRef: "#"},
    },
  },
}

const strictTreeSchema = {
  $id: "https://example.com/strict-tree",
  $recursiveAnchor: true,
  $ref: "tree",
  unevaluatedProperties: false,
}

import Ajv2019 from "ajv/dist/2019"
// const Ajv2019 = require("ajv/dist/2019").default
const ajv = new Ajv2019({
  schemas: [treeSchema, strictTreeSchema],
})
const validate = ajv.getSchema("https://example.com/strict-tree")
```

See [dynamic-refs](../spec/dynamic-ref.spec.ts) test for the example using `$dynamicAnchor`/`$dynamicRef`.

At the moment Ajv implements the spec for dynamic recursive references with these limitations:

- `$recursiveAnchor`/`$dynamicAnchor` can only be used in the schema root.
- `$recursiveRef`/`$dynamicRef` can only be hash fragments, without URI.

Ajv also does not support dynamic references in [asynchronous schemas](#asynchronous-validation) (Ajv extension) - it is assumed that the referenced schema is synchronous, and there is no validation-time check for it.

### \$data reference

With `$data` option you can use values from the validated data as the values for the schema keywords. See [proposal](https://github.com/json-schema-org/json-schema-spec/issues/51) for more information about how it works.

`$data` reference is supported in the keywords: const, enum, format, maximum/minimum, exclusiveMaximum / exclusiveMinimum, maxLength / minLength, maxItems / minItems, maxProperties / minProperties, formatMaximum / formatMinimum, formatExclusiveMaximum / formatExclusiveMinimum, multipleOf, pattern, required, uniqueItems.

The value of "$data" should be a [JSON-pointer](https://tools.ietf.org/html/rfc6901) to the data (the root is always the top level data object, even if the $data reference is inside a referenced subschema) or a [relative JSON-pointer](http://tools.ietf.org/html/draft-luff-relative-json-pointer-00) (it is relative to the current point in data; if the \$data reference is inside a referenced subschema it cannot point to the data outside of the root level for this subschema).

Examples.

This schema requires that the value in property `smaller` is less or equal than the value in the property larger:

```javascript
const ajv = new Ajv({$data: true})

const schema = {
  properties: {
    smaller: {
      type: "number",
      maximum: {$data: "1/larger"},
    },
    larger: {type: "number"},
  },
}

const validData = {
  smaller: 5,
  larger: 7,
}

ajv.validate(schema, validData) // true
```

This schema requires that the properties have the same format as their field names:

```javascript
const schema = {
  additionalProperties: {
    type: "string",
    format: {$data: "0#"},
  },
}

const validData = {
  "date-time": "1963-06-19T08:30:06.283185Z",
  email: "joe.bloggs@example.com",
}
```

`$data` reference is resolved safely - it won't throw even if some property is undefined. If `$data` resolves to `undefined` the validation succeeds (with the exclusion of `const` keyword). If `$data` resolves to incorrect type (e.g. not "number" for maximum keyword) the validation fails.

### $merge and $patch keywords

With the package [ajv-merge-patch](https://github.com/ajv-validator/ajv-merge-patch) you can use the keywords `$merge` and `$patch` that allow extending JSON Schemas with patches using formats [JSON Merge Patch (RFC 7396)](https://tools.ietf.org/html/rfc7396) and [JSON Patch (RFC 6902)](https://tools.ietf.org/html/rfc6902).

To add keywords `$merge` and `$patch` to Ajv instance use this code:

```javascript
require("ajv-merge-patch")(ajv)
```

Examples.

Using `$merge`:

```javascript
{
  $merge: {
    source: {
      type: "object",
      properties: {p: {type: "string"}},
      additionalProperties: false
    },
    with: {
      properties: {q: {type: "number"}}
    }
  }
}
```

Using `$patch`:

```javascript
{
  $patch: {
    source: {
      type: "object",
      properties: {p: {type: "string"}},
      additionalProperties: false
    },
    with: [{op: "add", path: "/properties/q", value: {type: "number"}}]
  }
}
```

The schemas above are equivalent to this schema:

```javascript
{
  type: "object",
  properties: {
    p: {type: "string"},
    q: {type: "number"}
  },
  additionalProperties: false
}
```

The properties `source` and `with` in the keywords `$merge` and `$patch` can use absolute or relative `$ref` to point to other schemas previously added to the Ajv instance or to the fragments of the current schema.

See the package [ajv-merge-patch](https://github.com/ajv-validator/ajv-merge-patch) for more information.

## User-defined keywords

The advantages of defining keywords are:

- allow creating validation scenarios that cannot be expressed using pre-defined keywords
- simplify your schemas
- help bringing a bigger part of the validation logic to your schemas
- make your schemas more expressive, less verbose and closer to your application domain
- implement data processors that modify your data (`modifying` option MUST be used in keyword definition) and/or create side effects while the data is being validated

If a keyword is used only for side-effects and its validation result is pre-defined, use option `valid: true/false` in keyword definition to simplify both generated code (no error handling in case of `valid: true`) and your keyword functions (no need to return any validation result).

The concerns you have to be aware of when extending JSON Schema standard with additional keywords are the portability and understanding of your schemas. You will have to support these keywords on other platforms and to properly document them so that everybody can understand and use your schemas.

You can define keywords with [addKeyword](./api.md#api-addkeyword) method. Keywords are defined on the `ajv` instance level - new instances will not have previously defined keywords.

Ajv allows defining keywords with:

- code generation function (used by all pre-defined keywords)
- validation function
- compilation function
- macro function

Example. `range` and `exclusiveRange` keywords using compiled schema:

```javascript
ajv.addKeyword({
  keyword: "range",
  type: "number",
  schemaType: "array",
  implements: "exclusiveRange",
  compile: ([min, max], parentSchema) =>
    parentSchema.exclusiveRange === true
      ? (data) => data > min && data < max
      : (data) => data >= min && data <= max,
})

const schema = {range: [2, 4], exclusiveRange: true}
const validate = ajv.compile(schema)
console.log(validate(2.01)) // true
console.log(validate(3.99)) // true
console.log(validate(2)) // false
console.log(validate(4)) // false
```

Several keywords (typeof, instanceof, range and propertyNames) are defined in [ajv-keywords](https://github.com/ajv-validator/ajv-keywords) package - they can be used for your schemas and as a starting point for your own keywords.

See [User-defined keywords](./keywords.md) for more details.

## Asynchronous schema compilation

During asynchronous compilation remote references are loaded using supplied function. See `compileAsync` [method](./api.md#api-compileAsync) and `loadSchema` [option](./api.md#options).

Example:

```javascript
const ajv = new Ajv({loadSchema: loadSchema})

ajv.compileAsync(schema).then(function (validate) {
  const valid = validate(data)
  // ...
})

function loadSchema(uri) {
  return request.json(uri).then(function (res) {
    if (res.statusCode >= 400) throw new Error("Loading error: " + res.statusCode)
    return res.body
  })
}
```

**Please note**: [Option](./api.md#options) `missingRefs` should NOT be set to `"ignore"` or `"fail"` for asynchronous compilation to work.

## Asynchronous validation

Example in Node.js REPL: https://runkit.com/esp/ajv-asynchronous-validation

You can define formats and keywords that perform validation asynchronously by accessing database or some other service. You should add `async: true` in the keyword or format definition (see [addFormat](./api.md#api-addformat), [addKeyword](./api.md#api-addkeyword) and [User-defined keywords](./keywords.md)).

If your schema uses asynchronous formats/keywords or refers to some schema that contains them it should have `"$async": true` keyword so that Ajv can compile it correctly. If asynchronous format/keyword or reference to asynchronous schema is used in the schema without `$async` keyword Ajv will throw an exception during schema compilation.

**Please note**: all asynchronous subschemas that are referenced from the current or other schemas should have `"$async": true` keyword as well, otherwise the schema compilation will fail.

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

**Please note**: If you use `removeAdditional` option with `additionalProperties` keyword inside `anyOf`/`oneOf` keywords your validation can fail with this schema, for example:

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

**Please note**: the default value is inserted in the generated validation code as a literal, so the value inserted in the data will be the deep clone of the default in the schema.

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

**Please note**: if you pass a scalar value to the validating function its type will be coerced and it will pass the validation, but the value of the variable you pass won't be updated because scalars are passed by value.

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
