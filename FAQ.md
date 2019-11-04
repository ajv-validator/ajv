# Frequently Asked Questions

The purpose of this document is to help find answers quicker. I am happy to continue the discussion about these issues, so please comment on some of the issues mentioned below or create a new issue if it seems more appropriate.



## Using JSON schema

Ajv implements JSON schema specification. Before submitting the issue about the behaviour of any validation keywords please review them in:

- [JSON Schema specification](https://tools.ietf.org/html/draft-handrews-json-schema-validation-00) (draft-07)
- [Validation keywords](https://github.com/epoberezkin/ajv/blob/master/KEYWORDS.md) in Ajv documentation
- [JSON Schema tutorial](https://spacetelescope.github.io/understanding-json-schema/) (for draft-04)


##### Why Ajv validates empty object as valid?

"properties" keyword does not require the presence of any properties, you need to use "required" keyword. It also doesn't require that the data is an object, so any other type of data will also be valid. To require a specific type use "type" keyword.


##### Why Ajv validates only the first item of the array?

"items" keyword support [two syntaxes](https://github.com/epoberezkin/ajv/blob/master/KEYWORDS.md#items) - 1) when the schema applies to all items; 2) when there is a different schema for each item in the beginning of the array. This problem means you are using the second syntax.



## Ajv API for returning validation errors

See [#65](https://github.com/epoberezkin/ajv/issues/65), [#212](https://github.com/epoberezkin/ajv/issues/212), [#236](https://github.com/epoberezkin/ajv/issues/236), [#242](https://github.com/epoberezkin/ajv/issues/242), [#256](https://github.com/epoberezkin/ajv/issues/256).


##### Why Ajv assigns errors as a property of validation function (or instance) instead of returning an object with validation results and errors?

The reasons are history (other fast validators with the same api) and performance (returning boolean is faster). Although more code is written to process errors than to handle successful results, almost all server-side validations pass. The existing API is more efficient from the performance point of view.

Ajv also supports asynchronous validation (with custom asynchronous formats and keywords) that returns a promise that either resolves to `true` or rejects with an error.


##### Would errors get overwritten in case of "concurrent" validations?

No. There is no concurrency in JavaScript - it is single-threaded. While a validation is run no other JavaScript code (that can access the same memory) can be executed. As long as the errors are used in the same execution block, the errors will not be overwritten.


##### Can we change / extend API to add a method that would return errors (rather than assign them to `errors` property)?

No. In many cases there is a module responsible for the validation in the application, usually to load schemas and to process errors. This module is the right place to introduce any custom API. Convenience is a subjective thing, changing or extending API purely because of convenience would either break backward compatibility (even if it's done in a new major version it still complicates migration) or bloat API (making it more difficult to maintain).


##### Why don't `"additionalProperties": false` errors display the property name?

Doing this would create a precedent where validated data is used in error messages, creating a vulnerability (e.g., when ajv is used to validate API data/parameters and error messages are logged).

Since the property name is already in the params object, in an application you can modify messages in any way you need. ajv-errors package allows modifying messages as well.



## Additional properties inside compound keywords anyOf, oneOf, etc.

See [#127](https://github.com/epoberezkin/ajv/issues/127), [#129](https://github.com/epoberezkin/ajv/issues/129), [#134](https://github.com/epoberezkin/ajv/issues/134), [#140](https://github.com/epoberezkin/ajv/issues/140), [#193](https://github.com/epoberezkin/ajv/issues/193), [#205](https://github.com/epoberezkin/ajv/issues/205), [#238](https://github.com/epoberezkin/ajv/issues/238), [#264](https://github.com/epoberezkin/ajv/issues/264).


##### Why the keyword `additionalProperties: false` fails validation when some properties are "declared" inside a subschema in `anyOf`/etc.?

The keyword `additionalProperties` creates the restriction on validated data based on its own value (`false` or schema object) and on the keywords `properties` and `patternProperties` in the SAME schema object. JSON Schema validators must NOT take into account properties used in other schema objects.

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

This problem is related to the problem explained above - properties treated as additional in the sense of `additionalProperties` keyword, based on `properties`/`patternProperties` keyword in the same schema object.

See the exemple in [Filtering Data](https://github.com/epoberezkin/ajv#filtering-data) section of readme.



## Generating schemas with resolved references ($ref)

See [#22](https://github.com/epoberezkin/ajv/issues/22), [#125](https://github.com/epoberezkin/ajv/issues/125), [#146](https://github.com/epoberezkin/ajv/issues/146), [#228](https://github.com/epoberezkin/ajv/issues/228), [#336](https://github.com/epoberezkin/ajv/issues/336), [#454](https://github.com/epoberezkin/ajv/issues/454).


##### Why Ajv does not replace references ($ref) with the actual referenced schemas as some validators do?

1. The scope of Ajv is validating data against JSON Schemas; inlining referenced schemas is not necessary for validation. When Ajv generates code for validation it either inlines the code of referenced schema or uses function calls. Doing schema manipulation is more complex and out of scope.
2. When schemas are recursive (or mutually recursive) resolving references would result in self-referencing recursive data-structures that can be difficult to process.
3. There are cases when such inlining would also require adding (or modyfing) `id` attribute in the inlined schema fragment to make the resulting schema equivalent.

There were many conversations about the meaning of `$ref` in [JSON Schema GitHub organisation](https://github.com/json-schema-org). The consensus is that while it is possible to treat `$ref` as schema inclusion with two caveats (above), this interpretation is unnecessary complex. A more efficient approach is to treat `$ref` as a delegation, i.e. a special keyword that validates the current data instance against the referenced schema. The analogy with programming languages is that `$ref` is a function call rather than a macro. See [here](https://github.com/json-schema-org/json-schema-spec/issues/279), for example.


##### How can I generate a schema where `$ref` keywords are replaced with referenced schemas?

There are two possible approaches:

1. Traverse schema (e.g. with json-schema-traverse) and replace every `$ref` with the referenced schema.
2. Use a specially constructed JSON Schema with a [custom keyword](https://github.com/epoberezkin/ajv/blob/master/CUSTOM.md) to traverse and modify your schema.
