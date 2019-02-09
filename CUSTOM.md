# Defining custom keywords

## Contents

- Define keyword with:
  - [validation function](#define-keyword-with-validation-function)
  - [compilation function](#define-keyword-with-compilation-function)
  - [macro function](#define-keyword-with-macro-function)
  - [inline compilation function](#define-keyword-with-inline-compilation-function)
- [Schema compilation context](#schema-compilation-context)
- [Validation time variables](#validation-time-variables)
- [Ajv utilities](#ajv-utilities)
- [Reporting errors in custom keywords](#reporting-errors-in-custom-keywords)
- [Short-circuit validation](#short-circuit-validation)


### Define keyword with validation function

Validation function will be called during data validation and it will be passed:
- schema
- data
- parent schema
- current data path
- parent data object
- the property name in the parent data object
- the root data

The access to the parent data object and the current property name allow to create keywords that modify the validated data (`modifying` option MUST be used in keyword definition in this case).

The function should return validation result as boolean. It can return an array of validation errors via `.errors` property of itself (otherwise a standard error will be used).

This way to define keywords is useful for:

- testing your keywords before converting them to compiled/inlined keywords
- defining keywords that do not depend on the schema value (e.g., when the value is always `true`). In this case you can add option `schema: false` to the keyword definition and the schemas won't be passed to the validation function, it will only receive the same 4 parameters as compiled validation function (see the next section).
- defining keywords where the schema is a value used in some expression.
- defining keywords that support [$data reference](https://github.com/epoberezkin/ajv#data-reference) - in this case validation function is required, either as the only option or in addition to compile, macro or inline function (see below).

__Please note__: In cases when validation flow is different depending on the schema and you have to use `if`s, this way to define keywords will have worse performance than compiled keyword returning different validation functions depending on the schema.


Example. `constant` keyword (a synonym for draft-06 keyword `const`, it is equivalent to `enum` keyword with one item):

```javascript
ajv.addKeyword('constant', {
  validate: function (schema, data) {
    return typeof schema == 'object' && schema !== null
            ? deepEqual(schema, data)
            : schema === data;
  },
  errors: false
});

var schema = {
  "constant": 2
};
var validate = ajv.compile(schema);
console.log(validate(2)); // true
console.log(validate(3)); // false

var schema = {
  "constant": {
    "foo": "bar"
  }
};
var validate = ajv.compile(schema);
console.log(validate({foo: 'bar'})); // true
console.log(validate({foo: 'baz'})); // false
```

`const` keyword is already available in Ajv.

__Please note:__ If the keyword does not define custom errors (see [Reporting errors in custom keywords](#reporting-errors-in-custom-keywords)) pass `errors: false` in its definition; it will make generated code more efficient.

To add asynchronous keyword pass `async: true` in its definition.


### Define keyword with "compilation" function

Compilation function will be called during schema compilation. It will be passed schema, parent schema and [schema compilation context](#schema-compilation-context) and it should return a validation function. This validation function will be passed during validation:
- data
- current data path
- parent data object
- the property name in the parent data object
- the root data

The access to the parent data object and the current property name allow to create keywords that modify the validated data (`modifying` option MUST be used).

The function should return validation result as boolean. It can return an array of validation errors via `.errors` property of itself (otherwise a standard error will be used).

In some cases it is the best approach to define keywords, but it has the performance cost of an extra function call during validation. If keyword logic can be expressed via some other JSON Schema then `macro` keyword definition is more efficient (see below).

All custom keywords types can have an optional `metaSchema` property in their definitions. It is a schema against which the value of keyword will be validated during schema compilation.

Custom keyword can also have an optional `dependencies` property in their definitions - it is a list of required keywords in a containing (parent) schema.

Example. `range` and `exclusiveRange` keywords using compiled schema:

```javascript
ajv.addKeyword('range', {
  type: 'number',
  compile: function (sch, parentSchema) {
    var min = sch[0];
    var max = sch[1];

    return parentSchema.exclusiveRange === true
            ? function (data) { return data > min && data < max; }
            : function (data) { return data >= min && data <= max; }
  },
  errors: false,
  metaSchema: {
    type: 'array',
    items: [
      { type: 'number' },
      { type: 'number' }
    ],
    additionalItems: false
  }
});

var schema = {
  "range": [2, 4],
  "exclusiveRange": true
};
var validate = ajv.compile(schema);
console.log(validate(2.01)); // true
console.log(validate(3.99)); // true
console.log(validate(2)); // false
console.log(validate(4)); // false
```

See note on custom errors and asynchronous keywords in the previous section.


### Define keyword with "macro" function

"Macro" function is called during schema compilation. It is passed schema, parent schema and [schema compilation context](#schema-compilation-context) and it should return another schema that will be applied to the data in addition to the original schema.

It is the most efficient approach (in cases when the keyword logic can be expressed with another JSON Schema) because it is usually easy to implement and there is no extra function call during validation.

In addition to the errors from the expanded schema macro keyword will add its own error in case validation fails.


Example. `range` and `exclusiveRange` keywords from the previous example defined with macro:

```javascript
ajv.addKeyword('range', {
  type: 'number',
  macro: function (schema, parentSchema) {
    return {
      minimum: schema[0],
      maximum: schema[1],
      exclusiveMinimum: !!parentSchema.exclusiveRange,
      exclusiveMaximum: !!parentSchema.exclusiveRange
    };
  },
  metaSchema: {
    type: 'array',
    items: [
      { type: 'number' },
      { type: 'number' }
    ],
    additionalItems: false
  }
});
```

Example. `contains` keyword from version 5 proposals that requires that the array has at least one item matching schema (see https://github.com/json-schema/json-schema/wiki/contains-(v5-proposal)):

```javascript
var schema = {
  "contains": {
    "type": "number",
    "minimum": 4,
    "exclusiveMinimum": true
  }
};

var validate = ajv.addKeyword('contains', {
  type: 'array',
  macro: function (schema) {
    return {
      "not": {
        "items": {
          "not": schema
        }
      }
    };
  }
})
.compile(schema);

console.log(validate([1,2,3])); // false
console.log(validate([2,3,4])); // false
console.log(validate([3,4,5])); // true, number 5 matches schema inside "contains"
```

`contains` keyword is already available in Ajv with option `v5: true`.

See the example of defining recursive macro keyword `deepProperties` in the [test](https://github.com/epoberezkin/ajv/blob/master/spec/custom.spec.js#L151).


### Define keyword with "inline" compilation function

Inline compilation function is called during schema compilation. It is passed four parameters: `it` (the current schema compilation context), `keyword` (added in v3.0 to allow defining multiple keywords with a single function), `schema` and `parentSchema` and it should return the code (as a string) that will be inlined in the code of compiled schema. This code can be either an expression that evaluates to the validation result (boolean) or a set of statements that assigns the validation result to a variable.

While it can be more challenging to define keywords with "inline" functions, it has several advantages:

- the best performance
- the precise control over validation process
- access to the parent data and the path to the currently validated data
- access to Ajv utilities via `it.util`


Example `even` keyword:

```javascript
var schema = { "even": true };

var validate = ajv.addKeyword('even', {
  type: 'number',
  inline: function (it, keyword, schema) {
    var op = schema ? '===' : '!==';
    return 'data' + (it.dataLevel || '') + ' % 2 ' + op + ' 0';
  },
  metaSchema: { type: 'boolean' }
})
.compile(schema);

console.log(validate(2)); // true
console.log(validate(3)); // false
```

`'data' + (it.dataLevel || '')` in the example above is the reference to the currently validated data. Also note that `schema` (keyword schema) is the same as `it.schema.even`, so schema is not strictly necessary here - it is passed for convenience.


Example `range` keyword defined using [doT template](https://github.com/olado/doT):

```javascript
// {% raw %}
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
  statements: true,
  metaSchema: {
    type: 'array',
    items: [
      { type: 'number' },
      { type: 'number' }
    ],
    additionalItems: false
  }
});
// {% endraw %}
```

`'valid' + it.level` in the example above is the expected name of the variable that should be set to the validation result.

Property `statements` in the keyword definition should be set to `true` if the validation code sets the variable instead of evaluating to the validation result.

The main challenge of defining inline keywords is that you have to write both the code that will execute during schema compilation (compile-time) and the code that will execute during data validation (validation-time - this code can be generated either using strings concatenation or using templates, see the examples below).

Ajv uses [doT templates](https://github.com/olado/doT) to generate the code of validation functions that makes it easier to separate compile-time and validation-time code because of the different syntax used in templates and in the code. Ajv also uses different variable names for compile-time and validation-time variables to make it easier to differentiate - compile-time variable names start with $ character.

Also you have to bear in mind that while compile-time variables exist in the scope of the function you wrote to compile the keyword, so they are isolated, validation-time variables share the scope with all the variables in the scope of a single validation function. So if your keyword has subschemas you have to append the schema level (`it.level`) to the variable names.

See [schema compilation context](#schema-compilation-context) for more information on which properties and utilities from the schema compilation context you can use.


## Schema compilation context

The first parameter passed to inline keyword compilation function (and the 3rd parameter passed to compile and macro keyword functions) is `it`, the schema compilation context. All the properties and functions documented here are safe to use in your keywords, they won't be renamed or change their meaning without major version change.

`it` object has the following properties:

- _level_ - the level of the current schema, `0` on the top level, `1` in subschemas (e.g. schemas in `properties` or `anyOf` keyword). The value of this property should be appended to the validation-time variables you use in the generated code.
- _dataLevel_ - the level of the currently validated data. It can be used to access both the property names and the data on all levels from the top. See [Validation time variables](#validation-time-variables).
- _schema_ - current level schema. The value of your keyword is `it.schema[keyword]`. This value is also passed as the 3rd parameter to the inline compilation function and the current level schema as the 4th parameter.
- _schemaPath_ - the validation time expression that evaluates to the property name of the current schema.
- _baseId_ - the current schema base URI that should be used as the base for resolving URIs in references ($ref).
- _async_ - truthy if the current schema is asynchronous.
- _opts_ - Ajv instance option. You should not be changing them.
- _formats_ - all formats available in Ajv instance, including the custom ones.
- _compositeRule_ - boolean indicating that the current schema is inside the compound keyword where failing some rule doesn't mean validation failure (`anyOf`, `oneOf`, `not`, `if` in `switch`). This flag is used to determine whether you can return validation result immediately after any error in case the option `allErrors` is not `true. You only need to do it if you have many steps in your keywords and potentially can define multiple errors.
- _validate_ - the function you need to use to compile subschemas in your keywords (see the [implementation](https://github.com/epoberezkin/ajv/blob/master/lib/dot/v5/switch.jst) of `switch` keyword for example).
- _util_ - [Ajv utilities](#ajv-utilities) you can use in your inline compilation functions.
- _self_ - Ajv instance.


## Validation time variables

There is a number of variables and expressions you can use in the generated (validation-time) code of your keywords.

- `'data' + (it.dataLevel || '')` - the variable name for the data at the current level.
- `'data' + ((it.dataLevel-1)||'')` - parent data if `it.dataLevel > 0`.
- `'rootData'` - the root data.
- `it.dataPathArr[it.dataLevel]` - the name of the property in the parent object that points to the current data if `it.dataLevel > 0`.
- `'validate.schema'` - top level schema of the current validation function at validation-time.
- `'validate.schema' + it.schemaPath` - current level schema available at validation time (the same schema at compile time is `it.schema`).
- `'validate.schema' + it.schemaPath + '.' + keyword` - the value of your custom keyword at validation-time. Keyword is passed as the second parameter to the inline compilation function to allow using the same function to compile multiple keywords.
- `'valid' + it.level` - the variable that you have to declare and to assign the validation result to if your keyword returns statements rather than expression (`statements: true`).
- `'errors'` - the number of encountered errors. See [Reporting errors in custom keywords](https://github.com/epoberezkin/ajv/blob/master/CUSTOM.md#reporting-errors-in-custom-keywords).
- `'vErrors'` - the array with errors collected so far. See [Reporting errors in custom keywords](https://github.com/epoberezkin/ajv/blob/master/CUSTOM.md#reporting-errors-in-custom-keywords).


## Ajv utilities

There are sevral useful functions you can use in your inline keywords. These functions are available as properties of `it.util` object:

##### .copy(Object obj[, Object target]) -&gt; Object

Clone or extend the object. If one object is passed, it is cloned. If two objects are passed, the second object is extended with the properties of the first.


##### .toHash(Array arr) -&gt; Object

Converts the array of strings to the object where each string becomes the key with the value of `true`.

```javascript
it.util.toHash(['a', 'b', 'c']) // { a: true, b: true, c: true }
```


##### .equal(value1, value2) -&gt; Boolean

Performs deep equality comparison. This function is used in keywords `enum`, `constant`, `uniqueItems` and can be used in custom keywords.


##### .getProperty(String key) -&gt; String

Converts the string that is the key/index to access the property/item to the JavaScript syntax to access the property (either "." notation or "[...]" notation).

```javascript
it.util.getProperty('a')   // ".a"
it.util.getProperty('1')   // "['1']"
it.util.getProperty("a'b") // "['a\\'b']"
it.util.getProperty(1)     // "[1]"
```


##### .schemaHasRules(Object schema, Object rules) -&gt; String

Determines whether the passed schema has rules that should be validated. This function should be used before calling `it.validate` to compile subschemas.

```javascript
it.util.schemaHasRules(schema, it.RULES.all) // true or false
```


##### .escapeQuotes(String str) -&gt; String

Escapes single quotes in the string, so it can be inserted in the generated code inside the string constant with the single quotes.


##### .toQuotedString(String str) -&gt; String

Converts the string to the JavaScript string constant in single quotes (using the escaped string).

```javascript
it.util.toQuotedString("a'b") // "'a\\'b'"
```


##### .getData(String jsonPointer, Number dataLevel, Array paths) -&gt; String

Returns the validation-time expression to safely access data based on the passed [relative json pointer](https://tools.ietf.org/html/draft-luff-relative-json-pointer-00) (See [examples](https://gist.github.com/geraintluff/5911303)).

```javascript
it.util.getData('2/test/1', it.dataLevel, it.dataPathArr)
// The result depends on the current level
// if it.dataLevel is 3 the result is "data1 && data1.test && data1.test[1]"
```


##### .escapeJsonPointer(String str) -&gt; String

Converts the property name to the JSON-Pointer fragment.


##### .unescapeJsonPointer (String str) -&gt; String

Converts JSON-Pointer fragment to the property name.


##### .unescapeFragment(String str) -&gt; String

Converts the property name to the JSON-Pointer fragment that can be used in URI.


##### .escapeFragment(String str) -&gt; String

Converts the JSON-Pointer fragment from URI to the property name.


## Reporting errors in custom keywords

All custom keywords but macro keywords can optionally create custom error messages.

Synchronous validating and compiled keywords should define errors by assigning them to `.errors` property of the validation function. Asynchronous keywords can return promise that rejects with `new Ajv.ValidationError(errors)`, where `errors` is an array of custom validation errors (if you don't want to define custom errors in asynchronous keyword, its validation function can return the promise that resolves with `false`).

Inline custom keyword should increase error counter `errors` and add error to `vErrors` array (it can be null). This can be done for both synchronous and asynchronous keywords. See [example range keyword](https://github.com/epoberezkin/ajv/blob/master/spec/custom_rules/range_with_errors.jst).

When inline keyword performs validation Ajv checks whether it created errors by comparing errors count before and after validation. To skip this check add option `errors` (can be `"full"`, `true` or `false`) to keyword definition:

```javascript
ajv.addKeyword('range', {
  type: 'number',
  inline: inlineRangeTemplate,
  statements: true,
  errors: true // keyword should create custom errors when validation fails
  // errors: 'full' // created errors should have dataPath already set
  // errors: false // keyword never creates errors, Ajv will add a default error
});
```

Each error object should at least have properties `keyword`, `message` and `params`, other properties will be added.

Inlined keywords can optionally define `dataPath` and `schemaPath` properties in error objects, that will be assigned by Ajv unless `errors` option of the keyword is `"full"`.

If custom keyword doesn't create errors, the default error will be created in case the keyword fails validation (see [Validation errors](https://github.com/epoberezkin/ajv#validation-errors)).


## Short-circuit validation

In some cases inline keyword can terminate validation and return the result as soon as it encounters the error. It is only practical if the keyword you define has many criteria to validate and you want it to be able to fail fast. You only need to do it if your keyword defines errors itself, otherwise Ajv will return when it creates the default error (if the conditions below are met).

Two conditions should be checked before keyword can return the result:

- option `allErrors` should not be used (`!it.opts.allErrors` should be true).
- the current schema should not be inside composite rule (e.g. `not` or `anyOf`), when failing some keyword does not mean failing the validation (`!it.compositeRule` should be true).

If these conditions are met your keyword can immediately return result. In case the current schema is synchronous (`it.async` is not `true`) you can add this to keyword's generated code when it encounters error `err`:

```javascript
if (vErrors === null) vErrors = [err];
else vErrors.push(err);
validate.errors = vErrors;
return false;
```

In case the current schema is asynchronous (it.async is truthy) to return result you need:

```javascript
if (vErrors === null) vErrors = [err];
else vErrors.push(err);
throw new ValidationError(vErrors); // ValidationError is in the scope
```

In case `allErrors` option is used the keyword should continue validation after it encounters an error trying to find as many errors as possible.

If `allErrors` option is not used but `it.compositeRule` is truthy the keyword may short-circuit its own validation but it should not return the final validation result.
