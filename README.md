# ajv - Another JSON Schema Validator

Currently the fastest JSON Schema validator for node.js and browser.

It uses [doT templates](https://github.com/olado/doT) to generate super-fast validating functions.

[![Build Status](https://travis-ci.org/epoberezkin/ajv.svg)](https://travis-ci.org/epoberezkin/ajv)
[![npm version](https://badge.fury.io/js/ajv.svg)](http://badge.fury.io/js/ajv)
[![Code Climate](https://codeclimate.com/github/epoberezkin/ajv/badges/gpa.svg)](https://codeclimate.com/github/epoberezkin/ajv)
[![Coverage Status](https://coveralls.io/repos/epoberezkin/ajv/badge.svg?branch=master&service=github)](https://coveralls.io/github/epoberezkin/ajv?branch=master)


NB: [Changes in version 3.0.0](https://github.com/epoberezkin/ajv/releases/tag/3.0.0).


## Features

- ajv implements full [JSON Schema draft 4](http://json-schema.org/) standard:
  - all validation keywords (see [JSON-Schema validation keywords](https://github.com/epoberezkin/ajv/blob/master/KEYWORDS.md))
  - full support of remote refs (remote schemas have to be added with `addSchema` or compiled to be available)
  - support of circular dependencies between schemas
  - correct string lengths for strings with unicode pairs (can be turned off)
  - [formats](#formats) defined by JSON Schema draft 4 standard and custom formats (can be turned off)
  - [validates schemas against meta-schema](#api-validateschema)
- supports [browsers](#using-in-browser) and nodejs 0.10-5.0
- [asynchronous loading](#asynchronous-compilation) of referenced schemas during compilation
- "All errors" validation mode with [option allErrors](#options)
- [error messages with parameters](#validation-errors) describing error reasons to allow creating custom error messages
- i18n error messages support with [ajv-i18n](https://github.com/epoberezkin/ajv-i18n) package (version >= 1.0.0)
- [filtering data](#filtering-data) from additional properties
- NEW: [assigning defaults](#assigning-defaults) to missing properties and items
- NEW: [coerce data](#coerce-data-types) to the types specified in `type` keywords
- [custom keywords](#defining-custom-keywords)
- keywords `switch`, `constant`, `contains`, `patternGroups`, `formatMaximum` / `formatMinimum` and `exclusiveFormatMaximum` / `exclusiveFormatMinimum` from [JSON-schema v5 proposals](https://github.com/json-schema/json-schema/wiki/v5-Proposals) with [option v5](#options)
- [v5 meta-schema](https://raw.githubusercontent.com/epoberezkin/ajv/master/lib/refs/json-schema-v5.json#) for schemas using v5 keywords
- NEW: [v5 $data reference](#data-reference) to use values from the validated data as values for the schema keywords

Currently ajv is the only validator that passes all the tests from [JSON Schema Test Suite](https://github.com/json-schema/JSON-Schema-Test-Suite) (according to [json-schema-benchmark](https://github.com/ebdrup/json-schema-benchmark), apart from the test that requires that `1.0` is not an integer that is impossible to satisfy in JavaScript).


## Performance

ajv generates code to turn JSON schemas into javascript functions that are efficient for v8 optimization.

Currently ajv is the fastest validator according to these benchmarks:

- [json-schema-benchmark](https://github.com/ebdrup/json-schema-benchmark) - 70% faster than the second place
- [jsck benchmark](https://github.com/pandastrike/jsck#benchmarks) - 20-190% faster
- [z-schema benchmark](https://rawgit.com/zaggino/z-schema/master/benchmark/results.html)
- [themis benchmark](https://cdn.rawgit.com/playlyfe/themis/master/benchmark/results.html)


## Install

```
npm install ajv
```


## Usage

Try it in the node REPL: https://tonicdev.com/npm/ajv


The fastest validation call:

```
var Ajv = require('ajv');
var ajv = Ajv(); // options can be passed, e.g. {allErrors: true}
var validate = ajv.compile(schema);
var valid = validate(data);
if (!valid) console.log(validate.errors);
```

or with less code

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
if (!valid) console.log(ajv.errorsText());
// ...
```

See [API](#api) and [Options](#options) for more details.

ajv compiles schemas to functions and caches them in all cases (using schema stringified with [json-stable-stringify](https://github.com/substack/json-stable-stringify) as a key), so that the next time the same schema is used (not necessarily the same object instance) it won't be compiled again.

The best performance is achieved when using compiled functions returned by `compile` or `getSchema` methods (there is no additional function call).

__Please note__: every time validation function or `ajv.validate` are called `errors` property is overwritten. You need to copy `errors` array reference to another variable if you want to use it later (e.g., in the callback). See [Validation errors](#validation-errors)


## Using in browser

You can require ajv directly from the code you browserify - in this case ajv will be a part of your bundle.

If you need to use ajv in several bundles you can create a separate UMD bundle using `npm run bundle` script (thanks to [siddo420](https://github.com/siddo420)).

Then you need to load ajv in the browser:
```
<script src="ajv.min.js"></script>
```

This bundle can be used with different module systems or creates global `Ajv` if no module system is found.

The browser bundle is available on [cdnjs](https://cdnjs.com/libraries/ajv).

Ajv was tested with these browsers:

[![Sauce Test Status](https://saucelabs.com/browser-matrix/epoberezkin.svg)](https://saucelabs.com/u/epoberezkin)


## Formats

The following formats are supported for string validation with "format" keyword:

- _date_: full-date according to [RFC3339](http://tools.ietf.org/html/rfc3339#section-5.6).
- _time_: time with optional time-zone.
- _date-time_: date-time from the same source (time-zone is mandatory). `date`, `time` and `date-time` validate ranges in `full` mode and only regexp in `fast` mode (see [options](#options)).
- _uri_: full uri with optional protocol.
- _email_: email address.
- _hostname_: host name acording to [RFC1034](http://tools.ietf.org/html/rfc1034#section-3.5).
- _ipv4_: IP address v4.
- _ipv6_: IP address v6.
- _regex_: tests whether a string is a valid regular expression by passing it to RegExp constructor.
- _uuid_: Universally Unique IDentifier according to [RFC4122](http://tools.ietf.org/html/rfc4122).
- _json-pointer_: JSON-pointer according to [RFC6901](https://tools.ietf.org/html/rfc6901).
- _relative-json-pointer_: relative JSON-pointer according to [this draft](http://tools.ietf.org/html/draft-luff-relative-json-pointer-00).

There are two modes of format validation: `fast` and `full`. This mode affects formats `date`, `time`, `date-time`, `uri`, `email`, and `hostname`. See [Options](#options) for details.

You can add additional formats and replace any of the formats above using [addFormat](#api-addformat) method.

You can find patterns used for format validation and the sources that were used in [formats.js](https://github.com/epoberezkin/ajv/blob/master/lib/compile/formats.js).


## $data reference

With `v5` option you can use values from the validated data as the values for the schema keywords. See [v5 proposal](https://github.com/json-schema/json-schema/wiki/$data-(v5-proposal)) for more information about how it works.

`$data` reference is supported in the keywords: constant, enum, format, maximum/minimum, exclusiveMaximum / exclusiveMinimum, maxLength / minLength, maxItems / minItems, maxProperties / minProperties, formatMaximum / formatMinimum, exclusiveFormatMaximum / exclusiveFormatMinimum, multipleOf, pattern, required, uniqueItems.

The value of "$data" should be a [relative JSON-pointer](http://tools.ietf.org/html/draft-luff-relative-json-pointer-00).

Examples.

This schema requires that the value in property `smaller` is less or equal than the value in the property larger:

```
var schema = {
  "properties": {
    "smaller": {
      "type": number,
      "maximum": { "$data": "1/larger" }
    },
    "larger": { "type": number }
  }
};

var validData = {
  smaller: 5,
  larger: 7
};
```

This schema requires that the properties have the same format as their field names:

```
var schema = {
  "additionalProperties": {
    "type": "string",
    "format": { "$data": "0#" }
  }
};

var validData = {
  'date-time': '1963-06-19T08:30:06.283185Z',
  email: 'joe.bloggs@example.com'
}
```

`$data` reference is resolved safely - it won't throw even if some property is undefined. If `$data` resolves to `undefined` the validation succeeds (with the exclusion of `constant` keyword). If `$data` resolves to incorrect type (e.g. not "number" for maximum keyword) the validation fails.


## Defining custom keywords

Starting from version 2.0.0 ajv supports custom keyword definitions.

WARNING: The main drawback of extending JSON-schema standard with custom keywords is the loss of portability of your schemas - it may not be possible to support these custom keywords on some other platforms. Also your schemas may be more challenging to read for other people. If portability is important you may prefer using additional validation logic outside of JSON-schema rather than putting it inside your JSON-schema.

The advantages of using custom keywords are:
- they allow you keeping a larger portion of your validation logic in the schema
- they make your schemas more expressive and less verbose
- they are fun to use

You can define custom keywords with [addKeyword](#api-addkeyword) method. Keywords are defined on the `ajv` instance level - new instances will not have previously defined keywords.

Ajv allows defining keywords with:
- validation function
- compilation function
- macro function
- inline compilation function that should return code (as string) that will be inlined in the currently compiled schema.


### Define keyword with validation function (NOT RECOMMENDED)

Validation function will be called during data validation. It will be passed schema, data and parentSchema (if it has 3 arguments) at validation time and it should return validation result as boolean. It can return an array of validation errors via `.errors` property of itself (otherwise a standard error will be used).

This way to define keywords is added as a way to quickly test your keyword and is not recommended because of worse performance than compiling schemas.


Example. `constant` keyword from version 5 proposals (that is equivalent to `enum` keyword with one item):

```
ajv.addKeyword('constant', { validate: function (schema, data) {
  return typeof schema == 'object && schema !== null'
          ? deepEqual(schema, data)
          : schema === data;
} });

var schema = { "constant": 2 };
var validate = ajv.compile(schema);
console.log(validate(2)); // true
console.log(validate(3)); // false

var schema = { "constant": { "foo": "bar" } };
var validate = ajv.compile(schema);
console.log(validate({foo: 'bar'})); // true
console.log(validate({foo: 'baz'})); // false
```

`constant` keyword is already available in Ajv with option `v5: true`.


### Define keyword with "compilation" function

Compilation function will be called during schema compilation. It will be passed schema and parent schema and it should return a validation function. This validation function will be passed data during validation; it should return validation result as boolean and it can return an array of validation errors via `.errors` property of itself (otherwise a standard error will be used).

In some cases it is the best approach to define keywords, but it has the performance cost of an extra function call during validation. If keyword logic can be expressed via some other JSON-schema then `macro` keyword definition is more efficient (see below).

Example. `range` and `exclusiveRange` keywords using compiled schema:

```
ajv.addKeyword('range', { type: 'number', compile: function (sch, parentSchema) {
  var min = sch[0];
  var max = sch[1];

  return parentSchema.exclusiveRange === true
          ? function (data) { return data > min && data < max; }
          : function (data) { return data >= min && data <= max; }
} });

var schema = { "range": [2, 4], "exclusiveRange": true };
var validate = ajv.compile(schema);
console.log(validate(2.01)); // true
console.log(validate(3.99)); // true
console.log(validate(2)); // false
console.log(validate(4)); // false
```


### Define keyword with "macro" function

"Macro" function is called during schema compilation. It is passed schema and parent schema and it should return another schema that will be applied to the data in addition to the original schema.

It is the most efficient approach (in cases when the keyword logic can be expressed with another JSON-schema) because it is usually easy to implement and there is no extra function call during validation.

In addition to the errors from the expanded schema macro keyword will add its own error in case validation fails.


Example. `range` and `exclusiveRange` keywords from the previous example defined with macro:

```
ajv.addKeyword('range', { type: 'number', macro: function (schema, parentSchema) {
  return {
    minimum: schema[0],
    maximum: schema[1],
    exclusiveMinimum: !!parentSchema.exclusiveRange,
    exclusiveMaximum: !!parentSchema.exclusiveRange
  };
} });
```

Example. `contains` keyword from version 5 proposals that requires that the array has at least one item matching schema (see https://github.com/json-schema/json-schema/wiki/contains-(v5-proposal)):

```
ajv.addKeyword('contains', { type: 'array', macro: function (schema) {
  return { "not": { "items": { "not": schema } } };
} });

var schema = {
  "contains": {
    "type": "number",
    "minimum": 4,
    "exclusiveMinimum": true
  }
};

var validate = ajv.compile(schema);
console.log(validate([1,2,3])); // false
console.log(validate([2,3,4])); // false
console.log(validate([3,4,5])); // true, number 5 matches schema inside "contains"
```

`contains` keyword is already available in Ajv with option `v5: true`.

See the example of defining recursive macro keyword `deepProperties` in the [test](https://github.com/epoberezkin/ajv/blob/master/spec/custom.spec.js#L151).


### Define keyword with "inline" compilation function

Inline compilation function is called during schema compilation. It is passed four parameters: `it` (the current schema compilation context), `keyword` (added in v3.0 to simplify compiling multiple keywords with a single function), `schema` and `parentSchema` and it should return the code (as a string) that will be inlined in the code of compiled schema. This code can be either an expression that evaluates to the validation result (boolean) or a set of statements that assigns the validation result to a variable.

While it can be more difficult to define keywords with "inline" functions, it can have the best performance.

Example `even` keyword:

```
ajv.addKeyword('even', { type: 'number', inline: function (it, keyword, schema) {
  var op = schema ? '===' : '!==';
  return 'data' + (it.dataLevel || '') + ' % 2 ' + op + ' 0';
} });

var schema = { "even": true };

var validate = ajv.compile(schema);
console.log(validate(2)); // true
console.log(validate(3)); // false
```

`'data' + (it.dataLevel || '')` in the example above is the reference to the currently validated data. Also note that `schema` (keyword schema) is the same as `it.schema.even`, so schema is not strictly necessary here - it is passed for convenience.


Example `range` keyword defined using [doT template](https://github.com/olado/doT):

```
var doT = require('dot');
var inlineRangeTemplate = doT.compile("\
{{ \
  var $data = 'data' + (it.dataLevel || '') \
    , $min = it.schema.range[0] \
    , $max = it.schema.range[1] \
    , $gt = it.schema.exclusiveRange ? '>' : '>=' \
    , $lt = it.schema.exclusiveRange ? '<' : '<='; \
}} \
var valid{{=it.level}} = {{=$data}} {{=$gt}} {{=$min}} && {{=$data}} {{=$lt}} {{=$max}}; \
");

ajv.addKeyword('range', {
  type: 'number',
  inline: inlineRangeTemplate,
  statements: true
});
```

`'valid' + it.level` in the example above is the expected name of the variable that should be set to the validation result.

Property `statements` in the keyword definition should be set to `true` if the validation code sets the variable instead of evaluating to the validation result.


### Defining errors in custom keywords

All custom keywords but macro keywords can create custom error messages.

Validating and compiled keywords should define errors by assigning them to `.errors` property of the validation function.

Inline custom keyword should increase error counter `errors` and add error to `vErrors` array (it can be null). See [example range keyword](https://github.com/epoberezkin/ajv/blob/master/spec/custom_rules/range_with_errors.jst).

When inline keyword performs validation Ajv checks whether it created errors by comparing errors count before and after validation. To skip this check add option `errors` (can be `"full"`, `true` or `false`) to keyword definition:

```
ajv.addKeyword('range', {
  type: 'number',
  inline: inlineRangeTemplate,
  statements: true,
  errors: true // keyword should create custom errors when validation fails
  // or errors: 'full' // created errors should have dataPath already set
});
```

Each error object should have properties `keyword`, `message` and `params`, other properties will be added.

Inlined keywords can optionally define `dataPath` property in error objects, that will be added by ajv unless `errors` option of the keyword is `"full"`.

If custom keyword doesn't create errors, the default error will be created in case the keyword fails validation (see [Validation errors](#validation-errors)).


## Asynchronous compilation

During asynchronous compilation remote references are loaded using supplied function. See `compileAsync` method and `loadSchema` [option](#options).

Example:

```
var ajv = Ajv({ loadSchema: loadSchema });

ajv.compileAsync(schema, function (err, validate) {
	if (err) return;
	var valid = validate(data);
});

function loadSchema(uri, callback) {
	request.json(uri, function(err, res, body) {
		if (err || res.statusCode >= 400)
			callback(err || new Error('Loading error: ' + res.statusCode));
		else
			callback(null, body);
	});
}
```

__Please note__: [Option](#options) `missingRefs` should NOT be set to `"ignore"` or `"fail"` for asynchronous compilation to work.


## Filtering data

With [option `removeAdditional`](#options) (added by [andyscott](https://github.com/andyscott)) you can filter data during the validation.

This option modifies original data.

Example:

```
var ajv = Ajv({ removeAdditional: true });
var schema = {
  "additionalProperties": false,
  "properties": {
    "foo": { "type": "number" },
    "bar": {
      "additionalProperties": { "type": "number" },
      "properties": {
        "baz": { "type": "string" }
      }
    }
  }
}

var data = {
  "foo": 0,
  "additional1": 1, // will be removed; `additionalProperties` == false
  "bar": {
    "baz": "abc",
    "additional2": 2 // will NOT be removed; `additionalProperties` != false
  },
}

var validate = ajv.compile(schema);

console.log(validate(data)); // true
console.log(data); // { "foo": 0, "bar": { "baz": "abc", "additional2": 2 }
```

If `removeAdditional` option in the example above were `"all"` then both `additional1` and `additional2` properties would have been removed.

If the option were `"failing"` then property `additional1` would have been removed regardless of its value and property `additional2` would have been removed only if its value were failing the schema in the inner `additionalProperties` (so in the example above it would have stayed because it passes the schema, but any non-number would have been removed).


## Assigning defaults

With [option `useDefaults`](#options) Ajv will assign values from `default` keyword in the schemas of `properties` and `items` (when it is the array of schemas) to the missing properties and items.

This option modifies original data.


Example 1 (`default` in `properties`):

```
var ajv = Ajv({ useDefaults: true });
var schema = {
  "type": "object",
  "properties": {
    "foo": { "type": "number" },
    "bar": { "type": "string", "default": "baz" }
  },
  "required": [ "foo", "bar" ]
};

var data = { "foo": 1 };

var validate = ajv.compile(schema);

console.log(validate(data)); // true
console.log(data); // { "foo": 1, "bar": "baz" }
```

Example 2 (`default` in `items`):

```
var schema = {
  "type": "array",
  "items": [
    { "type": "number" },
    { "type": "string", "default": "foo" }
  ]
}

var data = [ 1 ];

var validate = ajv.compile(schema);

console.log(validate(data)); // true
console.log(data); // [ 1, "foo" ]
```

`default` keywords in other cases are ignored:

- not in `properties` or `items` subschemas
- in schemas inside `anyOf`, `oneOf` and `not` (see #42)
- in `if` subschema of v5 `switch` keyword
- in schemas generated by custom macro keywords


## Coerce data types

When you are validating user inputs all your data properties are usually strings. The option `coerceTypes` allows you to have your data types coerced to the types specified in your schema `type` keywords, both to pass the validation and to use the correctly typed data afterwards.

This option modifies original data.

Please note, that if you pass a scalar value to the validating function its type will be coerced and it will pass the validation, but the value of the variable you pass won't be updated because scalars are passed by value.


Example:

```
var ajv = Ajv({ coerceTypes: true });
var schema = {
  "type": "object",
  "properties": {
    "foo": { "type": "number" },
    "bar": { "type": "boolean" }
  },
  "required": [ "foo", "bar" ]
};

var data = { "foo": "1", "bar": "false" };

var validate = ajv.compile(schema);

console.log(validate(data)); // true
console.log(data); // { "foo": 1, "bar": false }
```

The coercion rules, as you can see from the example, are different from JavaScript both to validate user input as expected and to have the coercion reversible (to correctly validate cases where different types are defined in subschemas of "anyOf" and other compound keywords).

See [Coercion rules](https://github.com/epoberezkin/ajv/blob/master/COERCION.md) for details.


## API

##### Ajv(Object options) -&gt; Object

Create ajv instance.

All the instance methods below are bound to the instance, so they can be used without the instance.


##### .compile(Object schema) -&gt; Function&lt;Object data&gt;

Generate validating function and cache the compiled schema for future use.

Validating function returns boolean and has properties `errors` with the errors from the last validation (`null` if there were no errors) and `schema` with the reference to the original schema.

Unless the option `validateSchema` is false, the schema will be validated against meta-schema and if schema is invalid the error will be thrown. See [options](#options).


##### .compileAsync(Object schema, Function callback)

Asyncronous version of `compile` method that loads missing remote schemas using asynchronous function in `options.loadSchema`. Callback will always be called with 2 parameters: error (or null) and validating function. Error will be not null in the following cases:

- missing schema can't be loaded (`loadSchema` calls callback with error).
- the schema containing missing reference is loaded, but the reference cannot be resolved.
- schema (or some referenced schema) is invalid.

The function compiles schema and loads the first missing schema multiple times, until all missing schemas are loaded.

See example in [Asynchronous compilation](#asynchronous-compilation).


##### .validate(Object schema|String key|String ref, data) -&gt; Boolean

Validate data using passed schema (it will be compiled and cached).

Instead of the schema you can use the key that was previously passed to `addSchema`, the schema id if it was present in the schema or any previously resolved reference.

Validation errors will be available in the `errors` property of ajv instance (`null` if there were no errors).

__Please note__: every time this method is called the errors are overwritten so you need to copy them to another variable if you want to use them later.


##### .addSchema(Array&lt;Object&gt;|Object schema [, String key])

Add schema(s) to validator instance. From version 1.0.0 this method does not compile schemas (but it still validates them). Because of that change, dependencies can be added in any order and circular dependencies are supported. It also prevents unnecessary compilation of schemas that are containers for other schemas but not used as a whole.

Array of schemas can be passed (schemas should have ids), the second parameter will be ignored.

Key can be passed that can be used to reference the schema and will be used as the schema id if there is no id inside the schema. If the key is not passed, the schema id will be used as the key.


Once the schema is added, it (and all the references inside it) can be referenced in other schemas and used to validate data.

Although `addSchema` does not compile schemas, explicit compilation is not required - the schema will be compiled when it is used first time.

By default the schema is validated against meta-schema before it is added, and if the schema does not pass validation the exception is thrown. This behaviour is controlled by `validateSchema` option.


##### .addMetaSchema(Object schema [, String key])

Adds meta schema that can be used to validate other schemas. That function should be used instead of `addSchema` because there may be instance options that would compile a meta schema incorrectly (at the moment it is `removeAdditional` option).

There is no need to explicitly add draft 4 meta schema (http://json-schema.org/draft-04/schema and http://json-schema.org/schema) - it is added by default, unless option `meta` is set to `false`. You only need to use it if you have a changed meta-schema that you want to use to validate your schemas. See `validateSchema`.

With option `v5: true` [meta-schema that includes v5 keywords](https://raw.githubusercontent.com/epoberezkin/ajv/master/lib/refs/json-schema-v5.json) also added.


##### <a name="api-validateschema"></a>.validateSchema(Object schema) -&gt; Boolean

Validates schema. This method should be used to validate schemas rather than `validate` due to the inconsistency of `uri` format in JSON-Schema standart.

By default this method is called automatically when the schema is added, so you rarely need to use it directly.

If schema doesn't have `$schema` property it is validated against draft 4 meta-schema (option `meta` should not be false) or against [v5 meta-schema](https://raw.githubusercontent.com/epoberezkin/ajv/master/lib/refs/json-schema-v5.json#) if option `v5` is true.

If schema has `$schema` property then the schema with this id (that should be previously added) is used to validate passed schema.

Errors will be available at `ajv.errors`.


##### .getSchema(String key) -&gt; Function&lt;Object data&gt;

Retrieve compiled schema previously added with `addSchema` by the key passed to `addSchema` or by its full reference (id). Returned validating function has `schema` property with the reference to the original schema.


##### .removeSchema(Object schema|String key|String ref)

Remove added/cached schema. Even if schema is referenced by other schemas it can be safely removed as dependent schemas have local references.

Schema can be removed using key passed to `addSchema`, it's full reference (id) or using actual schema object that will be stable-stringified to remove schema from cache.


##### <a name="api-addformat"></a>.addFormat(String name, String|RegExp|Function|Object format)

Add custom format to validate strings. It can also be used to replace pre-defined formats for ajv instance.

Strings are converted to RegExp.

Function should return validation result as `true` or `false`.

If object is passed it should have properties `validate` and `compare`. `validate` can be a string, RegExp or a function as described above. `compare` is a comparison function that accepts two strings and compares them according to the format meaning. This function is used with keywords `formatMaximum`/`formatMinimum` (from [v5 proposals](https://github.com/json-schema/json-schema/wiki/v5-Proposals) - `v5` option should be used). It should return `1` if the first value is bigger than the second value, `-1` if it is smaller and `0` if it is equal.

Custom formats can be also added via `formats` option.


##### <a name="api-addkeyword"></a>.addKeyword(String keyword, Object definition)

Add custom validation keyword to ajv instance.

Keyword should be a valid JavaScript identifier.

Keyword should be different from all standard JSON schema keywords and different from previously defined keywords. There is no way to redefine keywords or to remove keyword definition from the instance.

Keyword definition is an object with the following properties:

- _type_: optional string or array of strings with data type(s) that the keyword will apply to. If keyword is validating another type the validation function will not be called, so there is no need to check for data type inside validation function if `type` property is used.
- _validate_: validating function
- _compile_: compiling function
- _macro_: macro function
- _inline_: compiling function that returns code (as string)

_validate_, _compile_, _macro_ and _inline_ are mutually exclusive, only one should be used at a time.

With _macro_ function _type_ must not be specified, the types that the keyword will be applied for will be determined by the final schema.

See [Defining custom keywords](#defining-custom-keywords) for more details.


##### .errorsText([Array&lt;Object&gt; errors [, Object options]]) -&gt; String

Returns the text with all errors in a String.

Options can have properties `separator` (string used to separate errors, ", " by default) and `dataVar` (the variable name that dataPaths are prefixed with, "data" by default).


## Options

Defaults:

```
{
  allErrors:        false,
  removeAdditional: false,
  useDefaults:      false,
  coerceTypes:      false,
  verbose:          false,
  format:           'fast',
  formats:          {},
  schemas:          {},
  meta:             true,
  validateSchema:   true,
  addUsedSchema:    true,
  inlineRefs:       true,
  loopRequired:     Infinity,
  multipleOfPrecision: false,
  missingRefs:      true,
  loadSchema:       undefined, // function(uri, cb) { /* ... */ cb(err, schema); },
  uniqueItems:      true,
  unicode:          true,
  beautify:         false,
  cache:            new Cache,
  errorDataPath:    'object',
  jsonPointers:     false,
  messages:         true,
  v5:               false
}
```

- _allErrors_: check all rules collecting all errors. Default is to return after the first error.
- _removeAdditional_: remove additional properties - see example in [Filtering data](#filtering-data). This option is not used if schema is added with `addMetaSchema` method. Option values:
  - `false` (default) - not to remove additional properties
  - `"all"` - all additional properties are removed, regardless of `additionalProperties` keyword in schema (and no validation is made for them).
  - `true` - only additional properties with `additionalProperties` keyword equal to `false` are removed.
  - `"failing"` - additional properties that fail schema validation will be removed (where `additionalProperties` keyword is `false` or schema).
- _useDefaults_: replace missing properties and items with the values from corresponding `defaults` keywords. Default behaviour is to ignore `default` keywords. This option is not used if schema is added with `addMetaSchema` method. See example in [Assigning defaults](#assigning-defaults).
- _coerceTypes_: change data type of data to match `type` keyword. See the example in [Coerce data types](#coerce-data-types) and [coercion rules](https://github.com/epoberezkin/ajv/blob/master/COERCION.md).
- _verbose_: include the reference to the part of the schema (`schema` and `parentSchema`) and validated data in errors (false by default).
- _format_: formats validation mode ('fast' by default). Pass 'full' for more correct and slow validation or `false` not to validate formats at all. E.g., 25:00:00 and 2015/14/33 will be invalid time and date in 'full' mode but it will be valid in 'fast' mode.
- _formats_: an object with custom formats. Keys and values will be passed to `addFormat` method.
- _schemas_: an array or object of schemas that will be added to the instance. If the order is important, pass array. In this case schemas must have IDs in them. Otherwise the object can be passed - `addSchema(value, key)` will be called for each schema in this object.
- _meta_: add [meta-schema](http://json-schema.org/documentation.html) so it can be used by other schemas (true by default).
- _validateSchema_: validate added/compiled schemas against meta-schema (true by default). `$schema` property in the schema can either be http://json-schema.org/schema or http://json-schema.org/draft-04/schema or absent (draft-4 meta-schema will be used) or can be a reference to the schema previously added with `addMetaSchema` method. Option values:
  - `true` (default) -  if the validation fails, throw the exception.
  - `"log"` - if the validation fails, log error.
  - `false` - skip schema validation.
- _addUsedSchema_: by default methods `compile` and `validate` add schemas to the instance if they have `id` property that doesn't start with "#". If `id` is present and it is not unique the exception will be thrown. Set this option to `false` to skip adding schemas to the instance and the `id` uniqueness check when these methods are used. This option does not affect `addSchema` method.
- _inlineRefs_: Affects compilation of referenced schemas. Option values:
  - `true` (default) - the referenced schemas that don't have refs in them are inlined, regardless of their size - that substantially improves performance at the cost of the bigger size of compiled schema functions.
  - `false` - to not inline referenced schemas (they will be compiled as separate functions).
  - integer number - to limit the maximum number of keywords of the schema that will be inlined.
- _loopRequired_: by default `required` keyword is compiled into a single expression (or a sequence of statements in `allErrors` mode). In case of a very large number of properties in this keyword it may result in a very big validation function. Pass integer to set the number of properties above which `required` keyword will be validated in a loop - smaller validation function size but also worse performance.
- _multipleOfPrecision_: by default `multipleOf` keyword is validated by comparing the result of division with parseInt() of that result. It works for dividers that are bigger than 1. For small dividers such as 0.01 the result of the division is usually not integer (even when it should be integer, see issue #84). If you need to use fractional dividers set this option to some positive integer N to have `multipleOf` validated using this formula: `Math.abs(Math.round(division) - division) < 1e-N` (it is slower but allows for float arithmetics deviations).
- _missingRefs_: handling of missing referenced schemas. Option values:
  - `true` (default) - if the reference cannot be resolved during compilation the exception is thrown. The thrown error has properties `missingRef` (with hash fragment) and `missingSchema` (without it). Both properties are resolved relative to the current base id (usually schema id, unless it was substituted).
  - `"ignore"` - to log error during compilation and always pass validation.
  - `"fail"` - to log error and successfully compile schema but fail validation if this rule is checked.
- _loadSchema_: asynchronous function that will be used to load remote schemas when the method `compileAsync` is used and some reference is missing (option `missingRefs` should NOT be 'fail' or 'ignore'). This function should accept 2 parameters: remote schema uri and node-style callback. See example in [Asynchronous compilation](#asynchronous-compilation).
- _uniqueItems_: validate `uniqueItems` keyword (true by default).
- _unicode_: calculate correct length of strings with unicode pairs (true by default). Pass `false` to use `.length` of strings that is faster, but gives "incorrect" lengths of strings with unicode pairs - each unicode pair is counted as two characters.
- _beautify_: format the generated function with [js-beautify](https://github.com/beautify-web/js-beautify) (the validating function is generated without line-breaks). `npm install js-beautify` to use this option. `true` or js-beautify options can be passed.
- _cache_: an optional instance of cache to store compiled schemas using stable-stringified schema as a key. For example, set-associative cache [sacjs](https://github.com/epoberezkin/sacjs) can be used. If not passed then a simple hash is used which is good enough for the common use case (a limited number of statically defined schemas). Cache should have methods `put(key, value)`, `get(key)` and `del(key)`.
- _errorDataPath_: set `dataPath` to point to 'object' (default) or to 'property' (default behavior in versions before 2.0) when validating keywords `required`, `additionalProperties` and `dependencies`.
- _jsonPointers_: set `dataPath` propery of errors using [JSON Pointers](https://tools.ietf.org/html/rfc6901) instead of JavaScript property access notation.
- _messages_: Include human-readable messages in errors. `true` by default. `false` can be passed when custom messages are used (e.g. with [ajv-i18n](https://github.com/epoberezkin/ajv-i18n)).
- _v5_: add keywords `switch`, `constant`, `contains`, `patternGroups`, `formatMaximum` / `formatMinimum` and `exclusiveFormatMaximum` / `exclusiveFormatMinimum` from [JSON-schema v5 proposals](https://github.com/json-schema/json-schema/wiki/v5-Proposals). With this option added schemas without `$schema` property are validated against [v5 meta-schema](https://raw.githubusercontent.com/epoberezkin/ajv/master/lib/refs/json-schema-v5.json#). `false` by default.


## Validation errors

In case of validation failure Ajv assigns the array of errors to `.errors` property of validation function (or to `.errors` property of ajv instance in case `validate` or `validateSchema` methods were called).


### Error objects

Each error is an object with the following properties:

- _keyword_: validation keyword.
- _dataPath_: the path to the part of the data that was validated. By default `dataPath` uses JavaScript property access notation (e.g., `".prop[1].subProp"`). When the option `jsonPointers` is true (see [Options](#options)) `dataPath` will be set using JSON pointer standard (e.g., `"/prop/1/subProp"`).
- _schemaPath_: the path (JSON-pointer as a URI fragment) to the schema of the keyword that failed validation.
- _params_: the object with the additional information about error that can be used to create custom error messages (e.g., using [ajv-i18n](https://github.com/epoberezkin/ajv-i18n) package). See below for parameters set by all keywords.
- _message_: the standard error message (can be excluded with option `messages` set to false).
- _schema_: the schema of the keyword (added with `verbose` option).
- _parentSchema_: the schema containing the keyword (added with `verbose` option)
- _data_: the data validated by the keyword (added with `verbose` option).


### Error parameters

Properties of `params` object in errors depend on the keyword that failed validation.

- `maxItems`, `minItems`, `maxLength`, `minLength`, `maxProperties`, `minProperties` - property `limit` (number, the schema of the keyword).
- `additionalItems` - property `limit` (the maximum number of allowed items in case when `items` keyword is an array of schemas and `additionalItems` is false).
- `additionalProperties` - property `additionalProperty` (the property not used in `properties` and `patternProperties` keywords).
- `patternGroups` (with v5 option) - properties:
  - `pattern`
  - `reason` ("minimum"/"maximum"),
  - `limit` (max/min allowed number of properties matching number)
- `dependencies` - properties:
  - `property` (dependent property),
  - `missingProperty` (required missing dependency - only the first one is reported currently)
  - `deps` (required dependencies, comma separated list as a string),
  - `depsCount` (the number of required dependedncies).
- `format` - property `format` (the schema of the keyword).
- `maximum`, `minimum` - properties:
  - `limit` (number, the schema of the keyword),
  - `exclusive` (boolean, the schema of `exclusiveMaximum` or `exclusiveMinimum`),
  - `comparison` (string, comparison operation to compare the data to the limit, with the data on the left and the limit on the right; can be "<", "<=", ">", ">=")
- `multipleOf` - property `multipleOf` (the schema of the keyword)
- `pattern` - property `pattern` (the schema of the keyword)
- `required` - property `missingProperty` (required property that is missing).
- `type` - property `type` (required type(s), a string, can be a comma-separated list)
- `uniqueItems` - properties `i` and `j` (indices of duplicate items).
- `$ref` - property `ref` with the referenced schema URI.
- custom keywords (in case keyword definition doesn't create errors) - property `keyword` (the keyword name).


## Command line interface

Simple JSON-schema validation can be done from command line using [ajv-cli](https://github.com/jessedc/ajv-cli) package. At the moment it does not support referenced schemas.


## Tests

```
npm install
git submodule update --init
npm test
```

## Contributing

All validation functions are generated using doT templates in [dot](https://github.com/epoberezkin/ajv/tree/master/lib/dot) folder. Templates are precompiled so doT is not a run-time dependency.

`npm run build` - compiles templates to [dotjs](https://github.com/epoberezkin/ajv/tree/master/lib/dotjs) folder.

`npm run watch` - automatically compiles templates when files in dot folder change


## Changes history

See https://github.com/epoberezkin/ajv/releases


## License

[MIT](https://github.com/epoberezkin/ajv/blob/master/LICENSE)
