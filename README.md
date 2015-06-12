# ajv - Another JSON Schema Validator

One of the fastest JSON Schema validators for node.js. It uses [doT templates](https://github.com/olado/doT) to generate super-fast validating functions.


## JSON Schema standard

ajv implements full [JSON Schema draft 4](http://json-schema.org/) standard:

- all validation keywords
- full support of remote refs (remote schemas have to be added with `addSchema` or compiled to be available)
- correct string lengths for strings with unicode pairs (can be turned off)
- formats defined by JSON Schema draft 4 standard (can be turned off)

ajv passes all the tests from [JSON Schema Test Suite](https://github.com/json-schema/JSON-Schema-Test-Suite) (apart from the one that requires that `1.0` is not an integer).


## Benchmarks

Benchmark of the test suite - [json-schema-benchmark](https://github.com/ebdrup/json-schema-benchmark).


## Install

```
npm install ajv
```


## Usage

```
var Ajv = require('ajv');
var ajv = Ajv(); // options can be passed
var validate = ajv.compile(schema);
var valid = validate(data);
if (!valid) console.log(validate.errors);
```

or

```
// ...
var valid = ajv.validate(schema, data);
if (!valid) console.log(ajv.errors);
// ...
```

or

```
// ...
ajv.addSchema(schema, 'mySchema');
var valid = ajv.validate('mySchema', data);
if (!valid) console.log(ajv.errors);
// ...
```

ajv compiles schemas to functions and caches them in all cases (using stringified schema as a key - using [json-stable-stringify](https://github.com/substack/json-stable-stringify)), so that the next time the same schema is used (not necessarily the same object instance) it won't be compiled again.


## API

##### Ajv(Object options) -&gt; Object

Create ajv instance.

All the instance methods below are bound to the instance, so they can be used without the instance.


##### .compile(Object schema) -&gt; Function&lt;Object data&gt;

Generate validating function and cache the compiled schema for future use.

Validating function returns boolean and has properties `errors` with the errors from the last validation and `schema` with the reference to the original schema. 


##### .validate(Object schema|String key|String ref, data) -&gt; Boolean

Validate data using passed schema (it will be compiled and cached).

Instead of the schema you can use the key that was previously passed to `addSchema`, the schema id if it was present in the schema or any previously resolved reference.

Validation errors will be available in the `errors` property of ajv instance.


##### .addSchema(Array&lt;Object&gt;|Object schema [, String key]) -&gt; Function|Array&lt;Function&gt;

Add and compile schema(s). It does the same as `.compile` with two differences:

- array of schemas can be passed (schemas should have ids), the second parameter will be ignored.

- key can be passed that can be used to reference the schema and will be used as the schema id if there is no id inside the schema. If the key is not passed, the schema id will be used as the key.


Once the schema added it and all the references inside it can be referenced in other schemas and used to validate data.

In the current version all the referenced schemas should be added before the schema that uses them is compiled, so the circular references are not supported.


##### .getSchema(String key) -&gt; Function&lt;Object data&gt;

Retrieve compiled schema previously added with `addSchema`. Validating function has `schema` property with the reference to the original schema.


## Options

- _allErrors_: check all rules collecting all errors. Default is to return after the first error.
- _verbose_: include the reference to the part of the schema and validated data in errors (false by default).
- _format_: formats validation mode ('fast' by default). Pass 'full' for more correct and slow validation or `false` not to validate formats at all. E.g., 25:00:00 and 2015/14/33 will be invalid time and date in 'full' mode but it will be valid in 'fast' mode.
- _meta_: add [meta-schema](http://json-schema.org/documentation.html) so it can be used by other schemas (true by default).
- _uniqueItems_: validate `uniqueItems` keyword (true by default).
- _unicode_: calculate correct length of strings with unicode pairs (true by default). Pass `false` to use `.length` of strings that is faster, but gives "incorrect" lengths of strings with unicode pairs - each unicode pair is counted as two characters.
- _beautify_: format the generated function with [js-beautify](https://github.com/beautify-web/js-beautify) (the validating function is generated without line-breaks). `npm install js-beautify` to use this option. `true` or js-beautify options can be passed.


## Tests

```
git submodule update --init
npm test
```
