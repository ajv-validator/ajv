# ajv - Another JSON schema Validator

One of the fastest JSON schema validators. It uses [doT templates](https://github.com/olado/doT) to generate super-fast validating functions.


## TODO

- remote refs
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
- _verbose_: include the reference to the validated data in the errors.
- _format_: validate formats (true by default).
- _uniqueItems_: validate `uniqueItems` (true by default).
- _unicode_: calculate correct length of strings with unicode pairs (true by default - string lengths are calculated correctly but it is slower). Pass `false` to use `string.length` that is faster, but gives "incorrect" lengths of strings with unicode pairs - each unicode pair is counted as two characters.
- _beautify_: format the generated function with [js-beautify](https://github.com/beautify-web/js-beautify). `npm install js-beautify` to use this option.


## Tests

```
git submodule update --init
npm test
```
