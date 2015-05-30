# ajv - Another JSON schema Validator

## TODO

- refs (internal, remote with addSchema)
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

Compiles and caches in both cases, so that the next time the same schema is used (not necessarily the same object instance) it won't be compiled again.


## Options

- __allErrors__: if true, jv will continue validating all rules collecting all errors (false by default)
- __verbose__: include the reference to the validated data in the errors (false by default)
- __format__: if false, the formats won't be validated (true by default)
- __unicode__: if false, the lengths of strings with unicode pairs will be incorrect (true by default)
