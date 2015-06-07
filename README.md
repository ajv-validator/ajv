# ajv - Another JSON schema Validator

One of the fastest JSON schema validators. It uses [doT templates](https://github.com/olado/doT) to generate super-fast validating functions.


## JSON-schema standard

ajv implements full JSON-schema draft 4 standard:

- all validation keywords
- full support of remote refs (remote schemas have to be pre-loaded)
- correct string lengths for strings with unicode pairs (can be turned off)
- formats defined by JSON-schema (can be turned off)

ajv passes all the tests from [JSON Schema Test Suite](https://github.com/json-schema/JSON-Schema-Test-Suite) (apart from the one that requires that `1.0` is not an integer).


## TODO

- resolve missing remote refs when schemas are added
- custom formats (via options)
- schema validation before compilation
- bundle compiled templates (doT will be dev dependency)


## Install

```
npm install ajv
```


## Usage

```
var ajv = require('ajv')(options);
var validate = ajv.compile(schema);
var valid = validate(data);
if (!valid) console.log(validate.errors);
```

or

```
// ...
var valid = ajv.validate(schema, data);
// ...
```

ajv compiles schemas to functions and caches them in both cases (using stringified schema as a key - using [json-stable-stringify](https://github.com/substack/json-stable-stringify)), so that the next time the same schema is used (not necessarily the same object instance) it won't be compiled again.


## Options

- _allErrors_: check all rules collecting all errors. Default is to return after the first error.
- _verbose_: include the reference to the part of the schema and validated data in errors (false by default).
- _format_: validate formats (true by default).
- _meta_: add [meta-schema](http://json-schema.org/documentation.html) so it can be used by other schemas (true by default).
- _uniqueItems_: validate `uniqueItems` (true by default).
- _unicode_: calculate correct length of strings with unicode pairs (true by default). Pass `false` to use `.length` of strings that is faster, but gives "incorrect" lengths of strings with unicode pairs - each unicode pair is counted as two characters.
- _beautify_: format the generated function with [js-beautify](https://github.com/beautify-web/js-beautify) (the validating function is generated without line-breaks). `npm install js-beautify` to use this option. `true` or js-beautify options can be passed.


## Tests

```
git submodule update --init
npm test
```
