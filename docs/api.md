# API Reference

[[toc]]

## Ajv constructor and methods

### new Ajv(options: object)

Create Ajv instance:

```javascript
const ajv = new Ajv()
```

See [Options](./options)

### ajv.compile(schema: object): (data: any) => boolean | Promise < any >

Generate validating function and cache the compiled schema for future use.

Validating function returns a boolean value (or promise for async schemas that must have `$async: true` property - see [Asynchronous validation](./guide/async-validation.md)). This function has properties `errors` and `schema`. Errors encountered during the last validation are assigned to `errors` property (it is assigned `null` if there was no errors). `schema` property contains the reference to the original schema.

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

<a name="jtd-serialize"></a>

### ajv.compileSerializer(schema: object): (data: any) => string <Badge text="NEW" />

Generate serializing function based on the [JTD schema](./json-type-definition.md) (caches the schema) - only in JTD instance of Ajv (see example below).

Serializers compiled from JTD schemas can be more than 10 times faster than using `JSON.stringify`, because they do not traverse all the data, only the properties that are defined in the schema.

Properties not defined in the schema will not be included in serialized JSON, unless the schema has `additionalProperties: true` flag. It can also be beneficial from the application security point of view, as it prevents leaking accidentally/temporarily added additional properties to the API responses.

If you use JTD with typescript, the type for the schema can be derived from the data type, and generated serializer would only accept correct data type in this case:

```typescript
import Ajv, {JTDSchemaType} from "ajv/dist/jtd"
const ajv = new Ajv()

interface MyData = {
  foo: number
  bar?: string
}

const mySchema: JTDSchemaType<MyData> = {
  properties: {
    foo: {type: "int32"} // any JTD number type would be accepted here
  },
  optionalProperties: {
    bar: {type: "string"}
  }
}

const serializeMyData = ajv.compileSerializer(mySchema)

// serializeMyData has type (x: MyData) => string
// it prevents you from accidentally passing the wrong type
```

::: warning Please note
Compiled serializers do NOT validate passed data, it is assumed that the data is valid according to the schema. In the future there may be an option added that would make serializers also validate the data.
:::

<a name="jtd-parse"></a>

### ajv.compileParser(schema: object): (json: string) => any <Badge text="NEW" />

Generate parsing function based on the [JTD schema](./json-type-definition.md) (caches the schema) - only in JTD instance of Ajv (see example below).

Parsers compiled from JTD schemas have comparable performance to `JSON.parse`<sup>\*</sup> in case JSON string is valid according to the schema (and they do not just parse JSON - they ensure that parsed JSON is valid according to the schema as they parse), but they can be many times faster in case the string is invalid - for example, if schema expects an object, and JSON string is array the parser would fail on the first character.

Parsing will fail if there are properties not defined in the schema, unless the schema has `additionalProperties: true` flag.

If you use JTD with typescript, the type for the schema can be derived from the data type, and generated parser will return correct data type (see definitions example in the [serialize](#jtd-serialize) section):

```typescript
const parseMyData = ajv.compileParser(mySchema)

// parseMyData has type (s: string) => MyData | undefined
// it returns correct data type in case parsing is successful and undefined if not

const validData = parseMyData('{"foo":1}') // {foo: 1} - success

const invalidData = parseMyData('{"x":1}') // undefined - failure
console.log(parseMyData.position) // 4
console.log(parseMyData.message) // property x not allowed
```

::: warning Please note
Generated parsers is a NEW Ajv functionality (as of March 2021), there can be some edge cases that are not handled correctly - please report any issues/submit fixes.
:::

<sup>\*</sup> As long as empty schema `{}` is not used - there is a possibility to improve performance in this case. Also, the performance of parsing `discriminator` schemas depends on the position of discriminator tag in the schema - the best parsing performance will be achieved if the tag is the first property - this is how compiled JTD serializers generate JSON in case of discriminator schemas.

<a name="api-compileAsync"></a>

### ajv.compileAsync(schema: object, meta?: boolean): Promise < Function >

Asynchronous version of `compile` method that loads missing remote schemas using asynchronous function in `options.loadSchema`. This function returns a Promise that resolves to a validation function. An optional callback passed to `compileAsync` will be called with 2 parameters: error (or null) and validating function. The returned promise will reject (and the callback will be called with an error) when:

- missing schema can't be loaded (`loadSchema` returns a Promise that rejects).
- a schema containing a missing reference is loaded, but the reference cannot be resolved.
- schema (or some loaded/referenced schema) is invalid.

The function compiles schema and loads the first missing schema (or meta-schema) until all missing schemas are loaded.

You can asynchronously compile meta-schema by passing `true` as the second parameter.

Similarly to `compile`, it can return type guard in typescript.

See example in [Asynchronous compilation](./guide/managing-schemas.md#asynchronous-schema-compilation).

### ajv.validate(schemaOrRef: object | string, data: any): boolean

Validate data using passed schema (it will be compiled and cached).

Instead of the schema you can use the key that was previously passed to `addSchema`, the schema id if it was present in the schema or any previously resolved reference.

Validation errors will be available in the `errors` property of Ajv instance (`null` if there were no errors).

In typescript this method can act as a type guard (similarly to function returned by `compile` method - see example there).

::: warning Please note
Every time this method is called the errors are overwritten so you need to copy them to another variable if you want to use them later.
:::

If the schema is asynchronous (has `$async` keyword on the top level) this method returns a Promise. See [Asynchronous validation](./guide/async-validation.md).

<a name="add-schema"></a>

### ajv.addSchema(schema: object | object[], key?: string): Ajv

Add schema(s) to validator instance. This method does not compile schemas (but it still validates them). Because of that dependencies can be added in any order and circular dependencies are supported. It also prevents unnecessary compilation of schemas that are containers for other schemas but not used as a whole.

Array of schemas can be passed (schemas should have ids), the second parameter will be ignored.

Key can be passed that can be used to reference the schema and will be used as the schema id if there is no id inside the schema. If the key is not passed, the schema id will be used as the key.

Once the schema is added, it (and all the references inside it) can be referenced in other schemas and used to validate data.

Although `addSchema` does not compile schemas, explicit compilation is not required - the schema will be compiled when it is used first time.

By default the schema is validated against meta-schema before it is added, and if the schema does not pass validation the exception is thrown. This behaviour is controlled by `validateSchema` option.

::: tip Please note
Ajv return it instance for method chaining from all methods with the prefix `add*` and `remove*`:

```javascript
const validate = new Ajv().addSchema(schema).addFormat(name, regex).getSchema(uri)
```

:::

### ajv.addMetaSchema(schema: object | object[], key?: string): Ajv

Adds meta schema(s) that can be used to validate other schemas. That function should be used instead of `addSchema` because there may be instance options that would compile a meta schema incorrectly (at the moment it is `removeAdditional` option).

There is no need to explicitly add draft-07 meta schema (http://json-schema.org/draft-07/schema) - it is added by default, unless option `meta` is set to `false`. You only need to use it if you have a changed meta-schema that you want to use to validate your schemas. See `validateSchema`.

<a name="api-validateschema"></a>

### ajv.validateSchema(schema: object): boolean

Validates schema. This method should be used to validate schemas rather than `validate` due to the inconsistency of `uri` format in JSON Schema standard.

By default this method is called automatically when the schema is added, so you rarely need to use it directly.

If schema doesn't have `$schema` property, it is validated against draft 6 meta-schema (option `meta` should not be false).

If schema has `$schema` property, then the schema with this id (that should be previously added) is used to validate passed schema.

Errors will be available at `ajv.errors`.

### ajv.getSchema(key: string): undefined | ((data: any) => boolean | Promise < any >)

Retrieve compiled schema previously added with `addSchema` by the key passed to `addSchema` or by its full reference (id). The returned validating function has `schema` property with the reference to the original schema.

### ajv.removeSchema(schemaOrRef: object | string | RegExp): Ajv

Remove added/cached schema. Even if schema is referenced by other schemas it can be safely removed as dependent schemas have local references.

Schema can be removed using:

- key passed to `addSchema`
- it's full reference (id)
- RegExp that should match schema id or key (meta-schemas won't be removed)
- actual schema object (that will be optionally serialized) to remove schema from cache

If no parameter is passed all schemas but meta-schemas will be removed and the cache will be cleared.

<a name="api-addformat"></a>

### ajv.addFormat(name: string, format: Format): Ajv

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

<a name="api-addkeyword"></a>

### ajv.addKeyword(definition: object): Ajv

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
  $data?: true // to support [\$data reference](./guide/combining-schemas.md#data-reference) as the value of keyword.
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

`compile`, `macro` and `code` are mutually exclusive, only one should be used at a time. `validate` can be used separately or in addition to `compile` or `macro` to support [\$data reference](./guide/combining-schemas.md#data-reference).

::: tip Please note
If the keyword is validating data type that is different from the type(s) in its definition, the validation function will not be called (and expanded macro will not be used), so there is no need to check for data type inside validation function or inside schema returned by macro function (unless you want to enforce a specific type and for some reason do not want to use a separate `type` keyword for that). In the same way as standard keywords work, if the keyword does not apply to the data type being validated, the validation of this keyword will succeed.
:::

See [User defined keywords](./keywords.md) for more details.

### ajv.getKeyword(keyword: string): object | boolean

Returns keyword definition, `false` if the keyword is unknown.

### ajv.removeKeyword(keyword: string): Ajv

Removes added or pre-defined keyword so you can redefine them.

While this method can be used to extend pre-defined keywords, it can also be used to completely change their meaning - it may lead to unexpected results.

::: warning Please note
The schemas compiled before the keyword is removed will continue to work without changes. To recompile schemas use `removeSchema` method and compile them again.
:::

### ajv.errorsText(errors?: object[], options?: object): string

Returns the text with all errors in a String.

Options can have properties `separator` (string used to separate errors, ", " by default) and `dataVar` (the variable name that dataPaths are prefixed with, "data" by default).

## Validation errors

In case of validation failure, Ajv assigns the array of errors to `errors` property of validation function (or to `errors` property of Ajv instance when `validate` or `validateSchema` methods were called). In case of [asynchronous validation](./guide/async-validation.md), the returned promise is rejected with exception `Ajv.ValidationError` that has `errors` property.

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

::: warning Please note
Ajv is not fully consistent with JTD regarding the error objects in some scenarios - it will be consistent by the time Ajv version 8 is released. Therefore it is not recommended yet to use error objects for any advanced application logic.
:::

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

##### Options

This section is moved to [Initialization options](./options) page
