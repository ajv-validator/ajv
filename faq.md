---
page_name: faq
title: Ajv - Frequently Asked Questions
layout: main
---
# Frequently Asked Questions

The purpose of this document is to help find answers quicker. I am happy to continue the discussion about these issues, so please comment on some of the issues mentioned below or create a new one if it seems more appropriate.


## Ajv API for returning validation errors

See [#65](https://github.com/epoberezkin/ajv/issues/65), [#212](https://github.com/epoberezkin/ajv/issues/212), [#236](https://github.com/epoberezkin/ajv/issues/236), [#242](https://github.com/epoberezkin/ajv/issues/242), [#256](https://github.com/epoberezkin/ajv/issues/256).


##### Why Ajv assigns errors as a property of validation function (or instance) instead of returning an object with validation results and errors?

The reasons are history (other fast validators with the same api) and performance (returning boolean is faster). Although more code is written to process errors than to handle successful results, almost all server-side validations pass. The existing API is more efficient from the performance point of view.

Ajv also supports asynchronous validation (with custom asynchronous formats and keywords) that returns a promise that either resolves to `true` or rejects with an error.


##### Would errors get overwritten in case of "concurrent" validations?

No. There is no concurrency in JavaScript - it is single-threaded. While a validation is run no other JavaScript code (that can access the same memory) can be executed. As long as the errors are used in the same execution block, the errors will not be overwritten.


##### Can we change / extend API to add a method that would return errors (rather than assign them to `errors` property)?

No. In many cases there is a module responsible for the validation in the application, usually to load schemas and to process errors. This module is the right place to introduce any custom API. Convenience is a subjective thing, changing or extending API purely because of convenience would either break backward compatibility (even if it's done in a new major version it still complicates migration) or bloat API (making it more difficult to maintain).


## Additional properties inside compound keywords anyOf, oneOf, etc.

See [#127](https://github.com/epoberezkin/ajv/issues/127), [#129](https://github.com/epoberezkin/ajv/issues/129), [#134](https://github.com/epoberezkin/ajv/issues/134), [#140](https://github.com/epoberezkin/ajv/issues/140), [#193](https://github.com/epoberezkin/ajv/issues/193), [#205](https://github.com/epoberezkin/ajv/issues/205), [#238](https://github.com/epoberezkin/ajv/issues/238), [#264](https://github.com/epoberezkin/ajv/issues/264).


##### Why the keyword `additionalProperties: false` fails validation when some properties are "declared" inside a subschema in `anyOf`/etc.?

The keyword `additionalProperties` creates the restriction on validated data based on its own value (`false` or schema object) and on the keywords `properties` and `patternProperties` in the SAME schema object. JSON-schema validators must NOT take into account properties used in other schema objects.

While you can expect that the schema below would allow the objects either with properties `foo` and `bar` or with properties `foo` and `baz` and all other properties will be prohibited, this schema will only allow objects with one property `foo` (an empty object and any non-objects will also be valid):

```json
{
  "properties": { "foo": { "type": "number" } },
  "additionalProperties": false,
  "oneOf": [
    { "properties": { "bar": { "type": "number" } } },
    { "properties": { "baz": { "type": "number" } } }
  ]
}
```

The reason for that is that `additionalProperties` keyword ignores properties inside `oneOf` keyword subschemas. That's not the limitation of Ajv or any other validator, that's how it must work according to the standard (and if you consider all the problems with the alternatives it is the only sensible way to define this keyword).

There are several ways to implement the described logic that would allow two properties, please see the suggestions in the issues mentioned above.


##### Why the validation fails when I use option `removeAdditional` with the keyword `anyOf`/etc.?

This problem is related to the problem explained above - properties treated as additional in the sence of `additionalProperties` keyword, based on `properties`/`patternProperties` keyword in the same schema object.

See the exemple in [Filtering Data](/ajv#filtering-data) section of readme.
