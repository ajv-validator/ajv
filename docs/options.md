# Ajv options

[[toc]]

## Usage

This page describes properties of the options object that can be passed to Ajv constructor.

For example, to report all validation errors (rather than failing on the first errors) you should pass `allErrors` option to constructor:

```javascript
const ajv = new Ajv({allErrors: true})
```

## Option defaults

::: tip Do NOT pass default options
Passing the value below for some of the options is equivalent to not passing this option at all. There is no need to pass default option values - it is recommended to only pass option values that are different from defaults.
:::

```javascript
// see types/index.ts for actual types
const defaultOptions = {
  // strict mode options (NEW)
  strict: undefined, // *
  strictSchema: true, // *
  strictNumbers: true, // *
  strictTypes: "log", // *
  strictTuples: "log", // *
  strictRequired: false, // *
  allowUnionTypes: false, // *
  allowMatchingProperties: false, // *
  validateFormats: true, // *
  // validation and reporting options:
  $data: false, // *
  allErrors: false,
  verbose: false,
  discriminator: false, // *
  unicodeRegExp: true, // *
  timestamp: undefined // **
  parseDate: false // **
  allowDate: false // **
  int32range: true // **
  $comment: false, // *
  formats: {},
  keywords: {},
  schemas: {},
  logger: undefined,
  loadSchema: undefined, // *, function(uri: string): Promise {}
  // options to modify validated data:
  removeAdditional: false,
  useDefaults: false, // *
  coerceTypes: false, // *
  // advanced options:
  meta: true,
  validateSchema: true,
  addUsedSchema: true,
  inlineRefs: true,
  passContext: false,
  loopRequired: 200, // *
  loopEnum: 200, // NEW
  ownProperties: false,
  multipleOfPrecision: undefined, // *
  messages: true, // false with JTD
  code: {
    // NEW
    es5: false,
    lines: false,
    source: false,
    process: undefined, // (code: string) => string
    optimize: true,
  },
}
```

<sup>\*</sup> only with JSON Schema

<sup>\**</sup> only with JSON Type Definition

## Strict mode options <Badge text="v7" />

### strict

By default Ajv executes in strict mode, that is designed to prevent any unexpected behaviours or silently ignored mistakes in schemas (see [Strict Mode](./strict-mode.md) for more details). It does not change any validation results, but it makes some schemas invalid that would be otherwise valid according to JSON Schema specification.

Option values:

- `true` - throw an exception when any strict mode restriction is violated.
- `"log"` - log warning when any strict mode restriction is violated.
- `false` - ignore all strict mode violations.
- `undefined` (default) - use defaults for options strictSchema, strictNumbers, strictTypes, strictTuples and strictRequired.

### strictSchema

Prevent unknown keywords, formats etc. (see [Strict schema](./strict-mode.md#strict-schema))

Option values:

- `true` (default) - throw an exception when any strict schema restriction is violated.
- `"log"` - log warning when any strict schema restriction is violated.
- `false` - ignore all strict schema violations.

### strictNumbers

Whether to accept `NaN` and `Infinity` as number types during validation.

Option values:

- `true` (default) - fail validation if `NaN` or `Infinity` is passed where number is expected.
- `false` - allow `NaN` and `Infinity` as number.

### strictTypes

See [Strict types](./strict-mode.md#strict-types)

Option values:

- `true` - throw an exception when any strict types restriction is violated.
- `"log"` (default) - log warning when any strict types restriction is violated.
- `false` - ignore all strict types violations.

### strictTuples

See [Unconstrained tuples](./strict-mode.md#unconstrained-tuples)

Option values:

- `true` - throw an exception when any strict tuples restriction is violated.
- `"log"` (default) - log warning when any strict tuples restriction is violated.
- `false` - ignore all strict tuples violations.

### strictRequired

See [Defined required properties](./strict-mode.md#defined-required-properties)

Option values:

- `true` - throw an exception when strict required restriction is violated.
- `"log"` - log warning when strict required restriction is violated.
- `false` (default) - ignore strict required violations.

### allowUnionTypes

Pass true to allow using multiple non-null types in "type" keyword (one of `strictTypes` restrictions). see [Strict types](./strict-mode.md#strict-types)

### allowMatchingProperties

Pass true to allow overlap between "properties" and "patternProperties". Does not affect other strict mode restrictions. See [Strict Mode](./strict-mode.md).

### validateFormats

Format validation.

Option values:

- `true` (default) - validate formats (see [Formats](./guide/formats.md)). In [strict mode](./strict-mode.md) unknown formats will throw exception during schema compilation (and fail validation in case format keyword value is [\$data reference](./guide/combining-schemas.md#data-reference)).
- `false` - do not validate any format keywords (TODO they will still collect annotations once supported).

## Validation and reporting options

### $data

Support [\$data references](./guide/combining-schemas.md#data-reference). Draft 6 meta-schema that is added by default will be extended to allow them. If you want to use another meta-schema you need to use $dataMetaSchema method to add support for $data reference. See [API](#ajv-constructor-and-methods).

### allErrors

Check all rules collecting all errors. Default is to return after the first error.

### verbose

Include the reference to the part of the schema (`schema` and `parentSchema`) and validated data in errors (false by default).

### discriminator

Support [discriminator keyword](./json-schema.md#discriminator) from [OpenAPI specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.1.0.md).

### unicodeRegExp

By default Ajv uses unicode flag "u" with "pattern" and "patternProperties", as per JSON Schema spec. See [RegExp.prototype.unicode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode) .

Option values:

- `true` (default) - use unicode flag "u".
- `false` - do not use flag "u".

### timestamp <Badge text="JTD only">

Defines which Javascript types will be accepted for the [JTD timestamp type](./json-type-definition#type-form).

By default Ajv will accept both Date objects and [RFC3339](https://datatracker.ietf.org/doc/rfc3339/) strings. You can specify allowed values with the option `timestamp: "date"` or `timestamp: "string"`.

### parseDate <Badge text="JTD only">

Defines how date-time strings are parsed by [JTD parsers](./api.md#jtd-parse). By default Ajv parses date-time strings as string. Use `parseDate: true` to parse them as Date objects.

### allowDate <Badge text="JTD only">

Defines how date-time strings are parsed and validated. By default Ajv only allows full date-time strings, as required by JTD specification. Use `allowDate: true` to allow date strings both for validation and for parsing.

::: warning Option allowDate is not portable
This option makes JTD validation and parsing more permissive and non-standard. The date strings without time part will be accepted by Ajv, but will be rejected by other JTD validators.
:::

### int32range <Badge text="JTD only">

Can be used to disable range checking for `int32` and `uint32` types.

By default Ajv limits the range of these types to `[-2**31, 2**31 - 1]` for `int32` and to `[0, 2**32-1]` for `uint32` when validating and parsing.

With option `int32range: false` Ajv only requires that `uint32` is non-negative, otherwise does not check the range. Parser will limit the number size to 16 digits (approx. `2**53` - safe integer range).

::: warning Option int32range is not portable
This option makes JTD validation and parsing more permissive and non-standard. The integers within a wider range will be accepted by Ajv, but will be rejected by other JTD validators.
:::

### $comment

Log or pass the value of `$comment` keyword to a function.

Option values:

- `false` (default): ignore \$comment keyword.
- `true`: log the keyword value to console.
- function: pass the keyword value, its schema path and root schema to the specified function

### formats

An object with format definitions. Keys and values will be passed to `addFormat` method. Pass `true` as format definition to ignore some formats.

### keywords

An array of keyword definitions or strings. Values will be passed to `addKeyword` method.

### schemas

An array or object of schemas that will be added to the instance. In case you pass the array the schemas must have IDs in them. When the object is passed the method `addSchema(value, key)` will be called for each schema in this object.

### logger

Sets the logging method. Default is the global `console` object that should have methods `log`, `warn` and `error`. See [Error logging](#error-logging).

Option values:

- logger instance - it should have methods `log`, `warn` and `error`. If any of these methods is missing an exception will be thrown.
- `false` - logging is disabled.

### loadSchema

Asynchronous function that will be used to load remote schemas when `compileAsync` [method](#api-compileAsync) is used and some reference is missing (option `missingRefs` should NOT be 'fail' or 'ignore'). This function should accept remote schema uri as a parameter and return a Promise that resolves to a schema. See example in [Asynchronous compilation](./guide/managing-schemas.md#asynchronous-schema-compilation).

## Options to modify validated data

### removeAdditional

Remove additional properties - see example in [Removing additional properties](./guide/modifying-data.md#removing-additional-properties).

This option is not used if schema is added with `addMetaSchema` method.

Option values:

- `false` (default) - not to remove additional properties
- `"all"` - all additional properties are removed, regardless of `additionalProperties` keyword in schema (and no validation is made for them).
- `true` - only additional properties with `additionalProperties` keyword equal to `false` are removed.
- `"failing"` - additional properties that fail schema validation will be removed (where `additionalProperties` keyword is `false` or schema).

### useDefaults

Replace missing or undefined properties and items with the values from corresponding `default` keywords. Default behaviour is to ignore `default` keywords. This option is not used if schema is added with `addMetaSchema` method.

See examples in [Assigning defaults](./guide/modifying-data.md#assigning-defaults).

Option values:

- `false` (default) - do not use defaults
- `true` - insert defaults by value (object literal is used).
- `"empty"` - in addition to missing or undefined, use defaults for properties and items that are equal to `null` or `""` (an empty string).

### coerceTypes

Change data type of data to match `type` keyword. See the example in [Coercing data types](./guide/modifying-data.md#coercing-data-types) and [coercion rules](./coercion.md).

Option values:

- `false` (default) - no type coercion.
- `true` - coerce scalar data types.
- `"array"` - in addition to coercions between scalar types, coerce scalar data to an array with one element and vice versa (as required by the schema).

## Advanced options

### meta

Add [meta-schema](http://json-schema.org/documentation.html) so it can be used by other schemas (true by default). If an object is passed, it will be used as the default meta-schema for schemas that have no `$schema` keyword. This default meta-schema MUST have `$schema` keyword.

### validateSchema

Validate added/compiled schemas against meta-schema (true by default). `$schema` property in the schema can be http://json-schema.org/draft-07/schema or absent (draft-07 meta-schema will be used) or can be a reference to the schema previously added with `addMetaSchema` method.

Option values:

- `true` (default) - if the validation fails, throw the exception.
- `"log"` - if the validation fails, log error.
- `false` - skip schema validation.

### addUsedSchema

By default methods `compile` and `validate` add schemas to the instance if they have `$id` (or `id`) property that doesn't start with "#". If `$id` is present and it is not unique the exception will be thrown. Set this option to `false` to skip adding schemas to the instance and the `$id` uniqueness check when these methods are used. This option does not affect `addSchema` method.

### inlineRefs

Affects compilation of referenced schemas.

Option values:

- `true` (default) - the referenced schemas that don't have refs in them are inlined, regardless of their size - it improves performance.
- `false` - to not inline referenced schemas (they will always be compiled as separate functions).
- integer number - to limit the maximum number of keywords of the schema that will be inlined (to balance the total size of compiled functions and performance).

### passContext

Pass validation context to _compile_ and _validate_ keyword functions. If this option is `true` and you pass some context to the compiled validation function with `validate.call(context, data)`, the `context` will be available as `this` in your keywords. By default `this` is Ajv instance.

### loopRequired

By default `required` keyword is compiled into a single expression (or a sequence of statements in `allErrors` mode) up to 200 required properties. Pass integer to set a different number of properties above which `required` keyword will be validated in a loop (with a smaller validation function size and worse performance).

### loopEnum <Badge text="v7" />

By default `enum` keyword is compiled into a single expression with up to 200 allowed values. Pass integer to set the number of values above which `enum` keyword will be validated in a loop (with a smaller validation function size and worse performance).

### ownProperties

By default Ajv iterates over all enumerable object properties; when this option is `true` only own enumerable object properties (i.e. found directly on the object rather than on its prototype) are iterated. Contributed by @mbroadst.

### multipleOfPrecision

By default `multipleOf` keyword is validated by comparing the result of division with `parseInt()` of that result. It works for dividers that are bigger than 1. For small dividers such as 0.01 the result of the division is usually not integer (even when it should be integer, see issue [#84](https://github.com/ajv-validator/ajv/issues/84)). If you need to use fractional dividers set this option to some positive integer N to have `multipleOf` validated using this formula: `Math.abs(Math.round(division) - division) < 1e-N` (it is slower but allows for float arithmetic deviations).

### messages

Include human-readable messages in errors. `true` by default. `false` can be passed when messages are generated outside of Ajv code (e.g. with [ajv-i18n](https://github.com/ajv-validator/ajv-i18n)).

### code <Badge text="v7" />

Code generation options:

```typescript
type CodeOptions = {
  es5?: boolean // to generate es5 code - by default code is es6, with "for-of" loops, "let" and "const"
  lines?: boolean // add line-breaks to code - to simplify debugging of generated functions
  source?: boolean // add `source` property (see Source below) to validating function.
  process?: (code: string, schema?: SchemaEnv) => string // an optional function to process generated code
  // before it is passed to Function constructor.
  // It can be used to either beautify or to transpile code.
  optimize?: boolean | number // code optimization flag or number of passes, 1 pass by default,
  // code optimizations reduce the size of the generated code (bytes, based on the tests) by over 10%,
  // the number of code tree nodes by nearly 17%.
  // You would almost never need more than one optimization pass, unless you have some really complex schemas -
  // the second pass in the tests (it has quite complex schemas) only improves optimization by less than 0.1%.
  // See [Code optimization](./codegen.md#code-optimization) for details.
  formats?: Code
  // Code snippet created with `_` tagged template literal that contains all format definitions,
  // it can be the code of actual definitions or `require` call:
  // _`require("./my-formats")`
}

type Source = {
  code: string // unlike func.toString() it includes assignments external to function scope
  scope: Scope // see Code generation (TODO)
}
```
