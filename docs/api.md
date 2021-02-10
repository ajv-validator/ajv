# API Reference

- [Ajv constructor and methods](#ajv-constructor-and-methods)
- [Options](#options)
- [Validation errors](#validation-errors)

## Ajv constructor and methods

#### new Ajv(options: object)

Create Ajv instance:

```javascript
const ajv = new Ajv()
```

See [Options](#options)

#### ajv.compile(schema: object): (data: any) =\> boolean | Promise\<any\>

Generate validating function and cache the compiled schema for future use.

Validating function returns a boolean value (or promise for async schemas that must have `$async: true` property - see [Asynchronous validation](./validation.md#asynchronous-validation)). This function has properties `errors` and `schema`. Errors encountered during the last validation are assigned to `errors` property (it is assigned `null` if there was no errors). `schema` property contains the reference to the original schema.

The schema passed to this method will be validated against meta-schema unless `validateSchema` option is false. If schema is invalid, an error will be thrown. See [options](#options).

In typescript returned validation function can be a type guard if you pass type parameter:

```typescript
interface Foo {
  foo: number
}

const FooSchema: JSONSchemaType<Foo> = {
  type: "object",
  properties: {foo: {type: "number"}},
  required: ["foo"],
  additionalProperties: false,
}

const validate = ajv.compile<Foo>(FooSchema) // type of validate extends `(data: any) => data is Foo`
const data: any = {foo: 1}
if (validate(data)) {
  // data is Foo here
  console.log(data.foo)
} else {
  console.log(validate.errors)
}
```

See more advanced example in [the test](../spec/types/json-schema.spec.ts).

#### <a name="api-compileAsync"></a>ajv.compileAsync(schema: object, meta?: boolean): Promise\<Function\>

Asynchronous version of `compile` method that loads missing remote schemas using asynchronous function in `options.loadSchema`. This function returns a Promise that resolves to a validation function. An optional callback passed to `compileAsync` will be called with 2 parameters: error (or null) and validating function. The returned promise will reject (and the callback will be called with an error) when:

- missing schema can't be loaded (`loadSchema` returns a Promise that rejects).
- a schema containing a missing reference is loaded, but the reference cannot be resolved.
- schema (or some loaded/referenced schema) is invalid.

The function compiles schema and loads the first missing schema (or meta-schema) until all missing schemas are loaded.

You can asynchronously compile meta-schema by passing `true` as the second parameter.

Similarly to `compile`, it can return type guard in typescript.

See example in [Asynchronous compilation](./validation.md#asynchronous-schema-compilation).

#### ajv.validate(schemaOrRef: object | string, data: any): boolean

Validate data using passed schema (it will be compiled and cached).

Instead of the schema you can use the key that was previously passed to `addSchema`, the schema id if it was present in the schema or any previously resolved reference.

Validation errors will be available in the `errors` property of Ajv instance (`null` if there were no errors).

In typescript this method can act as a type guard (similarly to function returned by `compile` method - see example there).

**Please note**: every time this method is called the errors are overwritten so you need to copy them to another variable if you want to use them later.

If the schema is asynchronous (has `$async` keyword on the top level) this method returns a Promise. See [Asynchronous validation](./validation.md#asynchronous-validation).

#### <a name="add-schema"></a>ajv.addSchema(schema: object | object[], key?: string): Ajv

Add schema(s) to validator instance. This method does not compile schemas (but it still validates them). Because of that dependencies can be added in any order and circular dependencies are supported. It also prevents unnecessary compilation of schemas that are containers for other schemas but not used as a whole.

Array of schemas can be passed (schemas should have ids), the second parameter will be ignored.

Key can be passed that can be used to reference the schema and will be used as the schema id if there is no id inside the schema. If the key is not passed, the schema id will be used as the key.

Once the schema is added, it (and all the references inside it) can be referenced in other schemas and used to validate data.

Although `addSchema` does not compile schemas, explicit compilation is not required - the schema will be compiled when it is used first time.

By default the schema is validated against meta-schema before it is added, and if the schema does not pass validation the exception is thrown. This behaviour is controlled by `validateSchema` option.

**Please note**: Ajv return it instance for method chaining from all methods with the prefix `add*` and `remove*`:

```javascript
const validate = new Ajv().addSchema(schema).addFormat(name, regex).getSchema(uri)
```

#### ajv.addMetaSchema(schema: object | object[], key?: string): Ajv

Adds meta schema(s) that can be used to validate other schemas. That function should be used instead of `addSchema` because there may be instance options that would compile a meta schema incorrectly (at the moment it is `removeAdditional` option).

There is no need to explicitly add draft-07 meta schema (http://json-schema.org/draft-07/schema) - it is added by default, unless option `meta` is set to `false`. You only need to use it if you have a changed meta-schema that you want to use to validate your schemas. See `validateSchema`.

#### <a name="api-validateschema"></a>ajv.validateSchema(schema: object): boolean

Validates schema. This method should be used to validate schemas rather than `validate` due to the inconsistency of `uri` format in JSON Schema standard.

By default this method is called automatically when the schema is added, so you rarely need to use it directly.

If schema doesn't have `$schema` property, it is validated against draft 6 meta-schema (option `meta` should not be false).

If schema has `$schema` property, then the schema with this id (that should be previously added) is used to validate passed schema.

Errors will be available at `ajv.errors`.

#### ajv.getSchema(key: string): undefined | ((data: any) =\> boolean | Promise\<any\>)

Retrieve compiled schema previously added with `addSchema` by the key passed to `addSchema` or by its full reference (id). The returned validating function has `schema` property with the reference to the original schema.

#### ajv.removeSchema(schemaOrRef: object | string | RegExp): Ajv

Remove added/cached schema. Even if schema is referenced by other schemas it can be safely removed as dependent schemas have local references.

Schema can be removed using:

- key passed to `addSchema`
- it's full reference (id)
- RegExp that should match schema id or key (meta-schemas won't be removed)
- actual schema object (that will be optionally serialized) to remove schema from cache

If no parameter is passed all schemas but meta-schemas will be removed and the cache will be cleared.

#### <a name="api-addformat"></a>ajv.addFormat(name: string, format: Format): Ajv

```typescript
type Format =
  | true // to ignore this format (and pass validation)
  | string // will be converted to RegExp
  | RegExp
  | (data: string) => boolean
  | Object // format definition (see below and in types)
```

Add format to validate strings or numbers.

If object is passed it should have properties `validate`, `compare` and `async`:

```typescript
interface FormatDefinition { // actual type definition is more precise - see types.ts
  validate: string | RegExp | (data: number | string) => boolean | Promise<boolean>
  compare: (data1: string, data2: string): number // an optional function that accepts two strings
    // and compares them according to the format meaning.
    // This function is used with keywords `formatMaximum`/`formatMinimum`
    // (defined in [ajv-keywords](https://github.com/ajv-validator/ajv-keywords) package).
    // It should return `1` if the first value is bigger than the second value,
    // `-1` if it is smaller and `0` if it is equal.
  async?: true // if `validate` is an asynchronous function
  type?: "string" | "number" // "string" is default. If data type is different, the validation will pass.
}
```

Formats can be also added via `formats` option.

#### <a name="api-addkeyword"></a>ajv.addKeyword(definition: object):s Ajv

Add validation keyword to Ajv instance.

Keyword should be different from all standard JSON Schema keywords and different from previously defined keywords. There is no way to redefine keywords or to remove keyword definition from the instance.

Keyword must start with a letter, `_` or `$`, and may continue with letters, numbers, `_`, `$`, or `-`.
It is recommended to use an application-specific prefix for keywords to avoid current and future name collisions.

Example Keywords:

- `"xyz-example"`: valid, and uses prefix for the xyz project to avoid name collisions.
- `"example"`: valid, but not recommended as it may collide with future versions of JSON Schema etc.
- `"3-example"`: invalid as numbers are not allowed to be the first character in a keyword

Keyword definition is an object with the following properties:

```typescript
interface KeywordDefinition {
  // actual type definition is more precise - see types.ts
  keyword: string // keyword name
  type?: string | string[] // JSON data type(s) the keyword applies to. Default - all types.
  schemaType?: string | string[] // the required schema JSON type
  code?: Function // function to generate code, used for all pre-defined keywords
  validate?: Function // validating function
  compile?: Function // compiling function
  macro?: Function // macro function
  error?: object // error definition object - see types.ts
  schema?: false // used with "validate" keyword to not pass schema to function
  metaSchema?: object // meta-schema for keyword schema
  dependencies?: string[] // properties that must be present in the parent schema -
  // it will be checked during schema compilation
  implements?: string[] // keyword names to reserve that this keyword implements
  modifying?: true // MUST be passed if keyword modifies data
  valid?: boolean // to pre-define validation result, validation function result will be ignored -
  // this option MUST NOT be used with `macro` keywords.
  $data?: true // to support [\$data reference](./validation.md#data-reference) as the value of keyword.
  // The reference will be resolved at validation time. If the keyword has meta-schema,
  // it would be extended to allow $data and it will be used to validate the resolved value.
  // Supporting $data reference requires that keyword has `code` or `validate` function
  // (the latter can be used in addition to `compile` or `macro`).
  $dataError?: object // error definition object for invalid \$data schema - see types.ts
  async?: true // if the validation function is asynchronous
  // (whether it is returned from `compile` or passed in `validate` property).
  // It should return a promise that resolves with a value `true` or `false`.
  // This option is ignored in case of "macro" and "code" keywords.
  errors?: boolean | "full" // whether keyword returns errors.
  // If this property is not passed Ajv will determine
  // if the errors were set in case of failed validation.
}
```

`compile`, `macro` and `code` are mutually exclusive, only one should be used at a time. `validate` can be used separately or in addition to `compile` or `macro` to support [\$data reference](./validation.md#data-reference).

**Please note**: If the keyword is validating data type that is different from the type(s) in its definition, the validation function will not be called (and expanded macro will not be used), so there is no need to check for data type inside validation function or inside schema returned by macro function (unless you want to enforce a specific type and for some reason do not want to use a separate `type` keyword for that). In the same way as standard keywords work, if the keyword does not apply to the data type being validated, the validation of this keyword will succeed.

See [User defined keywords](./keywords.md) for more details.

#### ajv.getKeyword(keyword: string): object | boolean

Returns keyword definition, `false` if the keyword is unknown.

#### ajv.removeKeyword(keyword: string): Ajv

Removes added or pre-defined keyword so you can redefine them.

While this method can be used to extend pre-defined keywords, it can also be used to completely change their meaning - it may lead to unexpected results.

**Please note**: schemas compiled before the keyword is removed will continue to work without changes. To recompile schemas use `removeSchema` method and compile them again.

#### ajv.errorsText(errors?: object[], options?: object): string

Returns the text with all errors in a String.

Options can have properties `separator` (string used to separate errors, ", " by default) and `dataVar` (the variable name that dataPaths are prefixed with, "data" by default).

## Options

Option defaults:

```javascript
// see types/index.ts for actual types
const defaultOptions = {
  // strict mode options (NEW)
  strict: true,
  strictTypes: "log", // *
  strictTuples: "log", // *
  allowUnionTypes: false, // *
  allowMatchingProperties: false, // *
  validateFormats: true, // *
  // validation and reporting options:
  $data: false, // *
  allErrors: false,
  verbose: false, // *
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
  loopRequired: Infinity, // *
  loopEnum: Infinity, // NEW
  ownProperties: false,
  multipleOfPrecision: undefined, // *
  messages: true, // false with JTD
  ajvErrors: false // only with JTD
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

<sup>\*</sup> these options are not supported with JSON Type Definition schemas

#### Strict mode options (NEW in v7)

- _strict_: By default Ajv executes in strict mode, that is designed to prevent any unexpected behaviours or silently ignored mistakes in schemas (see [Strict Mode](./strict-mode.md) for more details). It does not change any validation results, but it makes some schemas invalid that would be otherwise valid according to JSON Schema specification. Option values:
  - `true` (default) - use strict mode and throw an exception when any strict mode restriction is violated.
  - `"log"` - log warning when any strict mode restriction is violated.
  - `false` - ignore all strict mode restrictions. Also ignores `strictTypes` restrictions unless it is explicitly passed.
- _strictTypes_: By default Ajv logs warning when "type" keyword is used in a way that may be incorrect or confusing to other people - see [Strict types](./strict-mode.md#strict-types) for more details. This option does not change validation results. Option values:
  - `true` - throw exception when any strictTypes restriction is violated.
  - `"log"` (default, unless option strict is `false`) - log warning when any strictTypes restriction is violated.
  - `false` - ignore all strictTypes restrictions violations.
- _strictTuples_: By default Ajv logs warning when "items" is array and "minItems" and "maxItems"/"additionalItems" not present or different from the number of items. See [Strict mode](./strict-mode.md) for more details. This option does not change validation results. Option values:
  - `true` - throw exception.
  - `"log"` (default, unless option strict is `false`) - log warning.
  - `false` - ignore strictTuples restriction violations.
- _allowUnionTypes_: pass true to allow using multiple non-null types in "type" keyword (one of `strictTypes` restrictions). see [Strict types](./strict-mode.md#strict-types)
- _allowMatchingProperties_: pass true to allow overlap between "properties" and "patternProperties". Does not affect other strict mode restrictions. See [Strict Mode](./strict-mode.md).
- _validateFormats_: format validation. Option values:
  - `true` (default) - validate formats (see [Formats](./validation.md#formats)). In [strict mode](./strict-mode.md) unknown formats will throw exception during schema compilation (and fail validation in case format keyword value is [\$data reference](./validation.md#data-reference)).
  - `false` - do not validate any format keywords (TODO they will still collect annotations once supported).

#### Validation and reporting options

- _\$data_: support [\$data references](./validation.md#data-reference). Draft 6 meta-schema that is added by default will be extended to allow them. If you want to use another meta-schema you need to use $dataMetaSchema method to add support for $data reference. See [API](#ajv-constructor-and-methods).
- _allErrors_: check all rules collecting all errors. Default is to return after the first error.
- _verbose_: include the reference to the part of the schema (`schema` and `parentSchema`) and validated data in errors (false by default).
- _\$comment_: log or pass the value of `$comment` keyword to a function. Option values:
  - `false` (default): ignore \$comment keyword.
  - `true`: log the keyword value to console.
  - function: pass the keyword value, its schema path and root schema to the specified function
- _formats_: an object with format definitions. Keys and values will be passed to `addFormat` method. Pass `true` as format definition to ignore some formats.
- _keywords_: an array of keyword definitions or strings. Values will be passed to `addKeyword` method.
- _schemas_: an array or object of schemas that will be added to the instance. In case you pass the array the schemas must have IDs in them. When the object is passed the method `addSchema(value, key)` will be called for each schema in this object.
- _logger_: sets the logging method. Default is the global `console` object that should have methods `log`, `warn` and `error`. See [Error logging](#error-logging). Option values:
  - logger instance - it should have methods `log`, `warn` and `error`. If any of these methods is missing an exception will be thrown.
  - `false` - logging is disabled.
- _loadSchema_: asynchronous function that will be used to load remote schemas when `compileAsync` [method](#api-compileAsync) is used and some reference is missing (option `missingRefs` should NOT be 'fail' or 'ignore'). This function should accept remote schema uri as a parameter and return a Promise that resolves to a schema. See example in [Asynchronous compilation](./validation.md#asynchronous-schema-compilation).

#### Options to modify validated data

- _removeAdditional_: remove additional properties - see example in [Removing additional properties](./validation.md#removing-additional-properties). This option is not used if schema is added with `addMetaSchema` method. Option values:
  - `false` (default) - not to remove additional properties
  - `"all"` - all additional properties are removed, regardless of `additionalProperties` keyword in schema (and no validation is made for them).
  - `true` - only additional properties with `additionalProperties` keyword equal to `false` are removed.
  - `"failing"` - additional properties that fail schema validation will be removed (where `additionalProperties` keyword is `false` or schema).
- _useDefaults_: replace missing or undefined properties and items with the values from corresponding `default` keywords. Default behaviour is to ignore `default` keywords. This option is not used if schema is added with `addMetaSchema` method. See examples in [Assigning defaults](./validation.md#assigning-defaults). Option values:
  - `false` (default) - do not use defaults
  - `true` - insert defaults by value (object literal is used).
  - `"empty"` - in addition to missing or undefined, use defaults for properties and items that are equal to `null` or `""` (an empty string).
- _coerceTypes_: change data type of data to match `type` keyword. See the example in [Coercing data types](./validation.md#coercing-data-types) and [coercion rules](./coercion.md). Option values:
  - `false` (default) - no type coercion.
  - `true` - coerce scalar data types.
  - `"array"` - in addition to coercions between scalar types, coerce scalar data to an array with one element and vice versa (as required by the schema).

#### Advanced options

- _meta_: add [meta-schema](http://json-schema.org/documentation.html) so it can be used by other schemas (true by default). If an object is passed, it will be used as the default meta-schema for schemas that have no `$schema` keyword. This default meta-schema MUST have `$schema` keyword.
- _validateSchema_: validate added/compiled schemas against meta-schema (true by default). `$schema` property in the schema can be http://json-schema.org/draft-07/schema or absent (draft-07 meta-schema will be used) or can be a reference to the schema previously added with `addMetaSchema` method. Option values:
  - `true` (default) - if the validation fails, throw the exception.
  - `"log"` - if the validation fails, log error.
  - `false` - skip schema validation.
- _addUsedSchema_: by default methods `compile` and `validate` add schemas to the instance if they have `$id` (or `id`) property that doesn't start with "#". If `$id` is present and it is not unique the exception will be thrown. Set this option to `false` to skip adding schemas to the instance and the `$id` uniqueness check when these methods are used. This option does not affect `addSchema` method.
- _inlineRefs_: Affects compilation of referenced schemas. Option values:
  - `true` (default) - the referenced schemas that don't have refs in them are inlined, regardless of their size - it improves performance.
  - `false` - to not inline referenced schemas (they will always be compiled as separate functions).
  - integer number - to limit the maximum number of keywords of the schema that will be inlined (to balance the total size of compiled functions and performance).
- _passContext_: pass validation context to _compile_ and _validate_ keyword functions. If this option is `true` and you pass some context to the compiled validation function with `validate.call(context, data)`, the `context` will be available as `this` in your keywords. By default `this` is Ajv instance.
- _loopRequired_: by default `required` keyword is compiled into a single expression (or a sequence of statements in `allErrors` mode). In case of a very large number of properties in this keyword it may result in a very big validation function. Pass integer to set the number of properties above which `required` keyword will be validated in a loop - smaller validation function size but also worse performance.
- _loopEnum_ (NEW in v7): by default `enum` keyword is compiled into a single expression. In case of a very large number of allowed values it may result in a large validation function. Pass integer to set the number of values above which `enum` keyword will be validated in a loop.
- _ownProperties_: by default Ajv iterates over all enumerable object properties; when this option is `true` only own enumerable object properties (i.e. found directly on the object rather than on its prototype) are iterated. Contributed by @mbroadst.
- _multipleOfPrecision_: by default `multipleOf` keyword is validated by comparing the result of division with parseInt() of that result. It works for dividers that are bigger than 1. For small dividers such as 0.01 the result of the division is usually not integer (even when it should be integer, see issue [#84](https://github.com/ajv-validator/ajv/issues/84)). If you need to use fractional dividers set this option to some positive integer N to have `multipleOf` validated using this formula: `Math.abs(Math.round(division) - division) < 1e-N` (it is slower but allows for float arithmetic deviations).
- _messages_: Include human-readable messages in errors. `true` by default. `false` can be passed when messages are generated outside of Ajv code (e.g. with [ajv-i18n](https://github.com/ajv-validator/ajv-i18n)).
- _ajvErrors_: this option is only supported with JTD schemas to generate error objects with the properties described in the first part of [Validation errors](#validation-errors) section, otherwise JTD errors are generated when JTD schemas are used (see the second part of [the same section](#validation-errors)).
- _code_ (new in v7): code generation options:

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
}

type Source = {
  code: string // unlike func.toString() it includes assignments external to function scope
  scope: Scope // see Code generation (TODO)
}
```

## Validation errors

In case of validation failure, Ajv assigns the array of errors to `errors` property of validation function (or to `errors` property of Ajv instance when `validate` or `validateSchema` methods were called). In case of [asynchronous validation](./validation.md#asynchronous-validation), the returned promise is rejected with exception `Ajv.ValidationError` that has `errors` property.

### Error objects

Each error reported when validating against JSON Schema (also when validating against JTD schema with option `ajvErrors`) is an object with the following properties:

```typescript
interface ErrorObject {
  keyword: string // validation keyword.
  dataPath: string // JSON pointer to the part of the data that was validated (e.g., `"/prop/1/subProp"`).
  schemaPath: string // the path (JSON-pointer as a URI fragment) to the schema of the failing keyword.
  // the object with the additional information about error that can be used to generate error messages
  // (e.g., using [ajv-i18n](https://github.com/ajv-validator/ajv-i18n) package).
  // See below for parameters set by all keywords.
  params: object // type is defined by keyword value, see below
  propertyName?: string // set for errors in `propertyNames` keyword schema.
  // `dataPath` still points to the object in this case.
  message?: string // the standard error message (can be excluded with option `messages` set to false).
  schema?: any // the schema of the keyword (added with `verbose` option).
  parentSchema?: object // the schema containing the keyword (added with `verbose` option)
  data?: any // the data validated by the keyword (added with `verbose` option).
}
```

[JTD specification](./json-type-definition.md) defines strict format for validation errors, where each error is an object with the following properties:

```typescript
interface JTDErrorObject {
  instancePath: string // JSON Pointer to the location in the data instance
  schemaPath: string // JSON Pointer to the location in the schema
}
```

This error format is used when using JTD schemas. To simplify usage, you may still generate Ajv error objects using `ajvErrors` option. You can also add a human-readable error message to error objects using option `messages`.

**Please note**: Ajv is not fully consistent with JTD regarding the error objects in some scenarios - it will be consistent by  the time Ajv version 8 is released. Therefore it is not recommended yet to use error objects for any advanced application logic.

### Error parameters

Properties of `params` object in errors depend on the keyword that failed validation.

In typescript, the ErrorObject is a discriminated union that allows to determine the type of error parameters based on the value of keyword:

```typescript
const ajv = new Ajv()
const validate = ajv.compile<MyData>(schema)
if (validate(data)) {
  // data is MyData here
  // ...
} else {
  // DefinedError is a type for all pre-defined keywords errors,
  // validate.errors has type ErrorObject[] - to allow user-defined keywords with any error parameters.
  // Users can extend DefinedError to include the keywords errors they defined.
  for (const err of validate.errors as DefinedError[]) {
    switch (err.keyword) {
      case "maximum":
        console.log(err.limit)
        break
      case "pattern":
        console.log(err.pattern)
        break
      // ...
    }
  }
}
```

Also see an example in [this test](../spec/types/error-parameters.spec.ts)

- `maxItems`, `minItems`, `maxLength`, `minLength`, `maxProperties`, `minProperties`:

```typescript
type ErrorParams = {limit: number} // keyword value
```

- `additionalItems`:

```typescript
// when `items` is an array of schemas and `additionalItems` is false:
type ErrorParams = {limit: number} // the maximum number of allowed items
```

- `additionalProperties`:

```typescript
type ErrorParams = {additionalProperty: string}
// the property not defined in `properties` and `patternProperties` keywords
```

- `dependencies`:

```typescript
type ErrorParams = {
  property: string // dependent property,
  missingProperty: string // required missing dependency - only the first one is reported
  deps: string // required dependencies, comma separated list as a string (TODO change to string[])
  depsCount: number // the number of required dependencies
}
```

- `format`:

```typescript
type ErrorParams = {format: string} // keyword value
```

- `maximum`, `minimum`, `exclusiveMaximum`, `exclusiveMinimum`:

```typescript
type ErrorParams = {
  limit: number // keyword value
  comparison: "<=" | ">=" | "<" | ">" // operation to compare the data to the limit,
  // with data on the left and the limit on the right
}
```

- `multipleOf`:

```typescript
type ErrorParams = {multipleOf: number} // keyword value
```

- `pattern`:

```typescript
type ErrorParams = {pattern: string} // keyword value
```

- `required`:

```typescript
type ErrorParams = {missingProperty: string} // required property that is missing
```

- `propertyNames`:

```typescript
type ErrorParams = {propertyName: string} // invalid property name
```

User-defined keywords can define other keyword parameters.

### Error logging

A logger instance can be passed via `logger` option to Ajv constructor. The use of other logging packages is supported as long as the package or its associated wrapper exposes the required methods. If any of the required methods are missing an exception will be thrown.

- **Required Methods**: `log`, `warn`, `error`

```javascript
const otherLogger = new OtherLogger()
const ajv = new Ajv({
  logger: {
    log: console.log.bind(console),
    warn: function warn() {
      otherLogger.logWarn.apply(otherLogger, arguments)
    },
    error: function error() {
      otherLogger.logError.apply(otherLogger, arguments)
      console.error.apply(console, arguments)
    },
  },
})
```
