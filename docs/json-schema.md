# JSON Schema validation keywords

In a simple way, JSON Schema is an object with validation keywords.

The keywords and their values define what rules the data should satisfy to be valid.

## JSON Schema draft-2019-09

v7 added support for all new keywords in draft-2019-09:

- [unevaluatedProperties](#unevaluatedproperties)
- [unevaluatedItems](#unevaluateditems)
- [dependentRequired](#dependentrequired)
- [dependentSchemas](#dependentschemas)
- [maxContains/minContains](#maxcontains--mincontains)
- [$recursiveAnchor/$recursiveRef](./validation.md#extending-recursive-schemas)

There is also support for [$dynamicAnchor/$dynamicRef](./validation.md#extending-recursive-schemas) from the next version of JSON Schema draft that will replace `$recursiveAnchor`/`$recursiveRef`.

## Included keywords

- [type](#type)
- [Keywords for numbers](#keywords-for-numbers)
  - [maximum / minimum and exclusiveMaximum / exclusiveMinimum](#maximum--minimum-and-exclusivemaximum--exclusiveminimum)
  - [multipleOf](#multipleof)
- [Keywords for strings](#keywords-for-strings)
  - [maxLength/minLength](#maxlength--minlength)
  - [pattern](#pattern)
  - [format](#format)
- [Keywords for arrays](#keywords-for-arrays)
  - [maxItems/minItems](#maxitems--minitems)
  - [uniqueItems](#uniqueitems)
  - [items](#items)
  - [additionalItems](#additionalitems)
  - [contains](#contains)
  - [maxContains/minContains](#maxcontains--mincontains)
  - [unevaluatedItems](#unevaluateditems) (NEW: added in draft 2019-09)
- [Keywords for objects](#keywords-for-objects)
  - [maxProperties/minProperties](#maxproperties--minproperties)
  - [required](#required)
  - [properties](#properties)
  - [patternProperties](#patternproperties)
  - [additionalProperties](#additionalproperties)
  - [dependencies](#dependencies) (deprecated from draft 2019-09)
  - [dependentRequired](#dependentrequired) (NEW: added in draft 2019-09)
  - [dependentSchemas](#dependentschemas) (NEW: added in draft 2019-09)
  - [propertyNames](#propertynames)
  - [unevaluatedProperties](#unevaluatedproperties) (NEW: added in draft 2019-09)
- [Keywords for all types](#keywords-for-all-types)
  - [enum](#enum)
  - [const](#const) (added in draft-06)
- [Compound keywords](#compound-keywords)
  - [not](#not)
  - [oneOf](#oneof)
  - [anyOf](#anyof)
  - [allOf](#allof)
  - [if/then/else](#ifthenelse)

## `type`

`type` keyword requires that the data is of certain type (or some of types). Its value can be a string (the allowed type) or an array of strings (multiple allowed types).

Type can be: `number`, `integer`, `string`, `boolean`, `array`, `object` or `null`.

**Examples**

1.  _schema_: `{type: "number"}`

    _valid_: `1`, `1.5`

    _invalid_: `"abc"`, `"1"`, `[]`, `{}`, `null`, `true`

2)  _schema_: `{type: "integer"}`

    _valid_: `1`, `2`

    _invalid_: `"abc"`, `"1"`, `1.5`, `[]`, `{}`, `null`, `true`

3.  _schema_: `{type: ["number", "string"]}`

    _valid_: `1`, `1.5`, `"abc"`, `"1"`

    _invalid_: `[]`, `{}`, `null`, `true`

All examples above are JSON Schemas that only require data to be of certain type to be valid.

Most other keywords apply only to a particular type of data. If the data is of different type, the keyword will not apply and the data will be considered valid.

In v7 Ajv introduced [Strict types](./strict-mode.md#strict-types) mode that makes these mistakes less likely by requiring that types are constrained with type keyword whenever another keyword that applies to specific type is used.

## Keywords for numbers

### `maximum` / `minimum` and `exclusiveMaximum` / `exclusiveMinimum`

The value of keyword `maximum` (`minimum`) should be a number. This value is the maximum (minimum) allowed value for the data to be valid.

The value of keyword `exclusiveMaximum` (`exclusiveMinimum`) should be a number. This value is the exclusive maximum (minimum) allowed value for the data to be valid (the data equal to this keyword value is invalid).

**Please note**: Boolean value for keywords `exclusiveMaximum` (`exclusiveMinimum`) is no longer supported.

**Examples**

1.  _schema_: `{type: "number", maximum: 5}`

    _valid_: `4`, `5`

    _invalid_: `6`, `7`

2.  _schema_: `{type: "number", minimum: 5}`

    _valid_: `5`, `6`

    _invalid_: `4`, `4.5`

3.  _schema_: `{type: "number", exclusiveMinimum: 5}`

    _valid_: `6`, `7`

    _invalid_: `4.5`, `5`

### `multipleOf`

The value of the keyword should be a number. The data to be valid should be a multiple of the keyword value (i.e. the result of division of the data on the value should be integer).

**Examples**

1.  _schema_: `{type: "number", multipleOf: 5}`

    _valid_: `5`, `10`

    _invalid_: `1`, `4`

2)  _schema_: `{type: "number", multipleOf: 2.5}`

    _valid_: `2.5`, `5`, `7.5`

    _invalid_: `1`, `4`

## Keywords for strings

### `maxLength` / `minLength`

The value of the keywords should be a number. The data to be valid should have length satisfying this rule. Unicode pairs are counted as a single character.

**Examples**

1.  _schema_: `{type: "string", maxLength: 5}`

    _valid_: `"abc"`, `"abcde"`

    _invalid_: `"abcdef"`

2)  _schema_: `{type: "string", minLength": 2}`

    _valid_: `"ab"`, `"😀😀"`

    _invalid_: `"a"`, `"😀"`

### `pattern`

The value of the keyword should be a string. The data to be valid should match the regular expression defined by the keyword value.

Ajv uses `new RegExp(value, "u")` to create the regular expression that will be used to test data.

**Example**

_schema_: `{type: "string", pattern: "[abc]+"}`

_valid_: `"a"`, `"abcd"`, `"cde"`

_invalid_: `"def"`, `""`

### `format`

The value of the keyword should be a string. The data to be valid should match the format with this name.

Ajv does not include any formats, they can be added with [ajv-formats](https://github.com/ajv-validator/ajv-formats) plugin.

**Example**

_schema_: `{type: "string", format: "ipv4"}`

_valid_: `"192.168.0.1"`

_invalid_: `"abc"`

## Keywords for arrays

### `maxItems` / `minItems`

The value of the keywords should be a number. The data array to be valid should not have more (less) items than the keyword value.

**Example**

_schema_: `{type: "array", maxItems: 3}`

_valid_: `[]`, `[1]`, `["1", 2, "3"]`

_invalid_: `[1, 2, 3, 4]`

### `uniqueItems`

The value of the keyword should be a boolean. If the keyword value is `true`, the data array to be valid should have unique items.

**Example**

_schema_: `{type: "array", uniqueItems: true}`

_valid_: `[]`, `[1]`, `["1", 2, "3"]`

_invalid_: `[1, 2, 1]`, `[{a: 1, b: 2}, {b: 2, a: 1}]`

### `items`

The value of the keyword should be an object or an array of objects.

If the keyword value is an object, then for the data array to be valid each item of the array should be valid according to the schema in this value. In this case the `additionalItems` keyword is ignored.

If the keyword value is an array, then items with indices less than the number of items in the keyword should be valid according to the schemas with the same indices. Whether additional items are valid will depend on `additionalItems` keyword.

**Examples**

1.  _schema_: `{type: "array", items: {type: "integer"}}`

    _valid_: `[1,2,3]`, `[]`

    _invalid_: `[1,"abc"]`

2)  _schema_:

    ```javascript
    {
      type: "array",
      items: [{type: "integer"}, {type: "string"}]
    }
    ```

    _valid_: `[1]`, `[1, "abc"]`, `[1, "abc", 2]`, `[]`

    _invalid_: `["abc", 1]`, `["abc"]`

The schema in example 2 will log warning by default (see `strictTuples` option), because it defines unconstrained tuple. To define a tuple with exactly 2 elements use `minItems` and `additionalItems` keywords (see example 1 in `additionalItems`).

### `additionalItems`

The value of the keyword should be a boolean or an object.

If `items` keyword is not present or it is an object, `additionalItems` keyword should be ignored regardless of its value. By default Ajv will throw exception in this case - see [Strict mode](./strict-mode.md)

If `items` keyword is an array and data array has not more items than the length of `items` keyword value, `additionalItems` keyword is also ignored.

If the length of data array is bigger than the length of "items" keyword value than the result of the validation depends on the value of `additionalItems` keyword:

- `false`: data is invalid
- `true`: data is valid
- an object: data is valid if all additional items (i.e. items with indices greater or equal than "items" keyword value length) are valid according to the schema in "additionalItems" keyword.

The schemas in examples 2-3 log warning by default, use option `strictTuples: false` to allow)

**Examples**

1.  _schema_:

    ```javascript
    {
      type: "array",
      items: [{type: "integer"}, {type: "integer"}],
      minItems: 2
      additionalItems: false
    }
    ```

    _valid_: `[1, 2]`

    _invalid_: `[]`, `[1]`, `[1, 2, 3]`, `[1, "abc"]` (any wrong number of items or wrong type)

2.  _schema_:

    ```javascript
    {
      type: "array",
      items: [{type: "integer"}, {type: "integer"}],
      additionalItems: true
    }
    ```

    _valid_: `[]`, `[1, 2]`, `[1, 2, 3]`, `[1, 2, "abc"]`

    _invalid_: `["abc"]`, `[1, "abc", 3]`

3.  _schema_:

    ```javascript
    {
      type: "array",
      items: [{type: "integer"}, {type: "integer"}],
      additionalItems: {type: "string"}
    }
    ```

    _valid_: `[]`, `[1, 2]`, `[1, 2, "abc"]`

    _invalid_: `["abc"]`, `[1, 2, 3]`

### `contains`

The value of the keyword is a JSON Schema. The array is valid if it contains at least one item that is valid according to this schema.

**Example**

_schema_: `{type: "array", contains: {type: "integer"}}`

_valid_: `[1]`, `[1, "foo"]`, any array with at least one integer

_invalid_: `[]`, `["foo", "bar"]`, any array without integers

### `maxContains` / `minContains`

The value of these keywords should be an integer.

Without `contains` keyword they are ignored (logs error or throws exception in ajv [strict mode](./strict-mode.md)).

The array is valid if it contains at least `minContains` items and no more than `maxContains` items that are valid against the schema in `contains` keyword.

**Example**

_schema_:

```javascript
{
  type: "array",
  contains: {type: "integer"},
  minContains: 2,
  maxContains: 3
}
```

_valid_: `[1, 2]`, `[1, 2, 3, "foo"]`, any array with 2 or 3 integers

_invalid_: `[]`, `[1, "foo"]`, `[1, 2, 3, 4]`, any array with fewer than 2 or more than 3 integers

### `unevaluatedItems`

The value of this keyword is a JSON Schema (can be a boolean).

This schema will be applied to all array items that were not evaluated by other keywords for items (`items`, `additionalItems` and `contains`) in the current schema and all sub-schemas that were valid for this data instance. It includes:

- all subschemas schemas in `allOf` and `$ref` keywords
- valid sub-schemas in `oneOf` and `anyOf` keywords
- sub-schema in `if` keyword
- sub-schemas in `then` or `else` keywords that were applied based on the validation result by `if` keyword.

The only scenario when this keyword would be applied to some items is when `items` keyword value is an array of schemas and `additionalItems` was not present (or did not apply, in case it was present in some invalid subschema).

Some user-defined keywords can also make items "evaluated".

**Example**

_schema_:

```javascript
{
  type: "array",
  items: [
    {type: "number"},
    {type: "number"}
  ],
  unevaluatedItems: false,
  anyOf: [
    {items: [true, true, {type: "number"}]},
    {items: [true, true, {type: "boolean"}]}
  ]
}
```

_valid_: `[1, 2, 3]`, `[1, 2, true]`

_invalid_:

- `[1, 2]` - the third item is not present
- `[1, 2, "3"]` - the third item is "unevaluated"

See [tests](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/master/tests/draft2019-09/unevaluatedItems.json) for `unevaluatedItems` keyword for other examples.

## Keywords for objects

### `maxProperties` / `minProperties`

The value of the keywords should be a number. The data object to be valid should have not more (less) properties than the keyword value.

**Example**

_schema_: `{type: "object", maxProperties: 2 }`

_valid_: `{}`, `{a: 1}`, `{a: "1", b: 2}`

_invalid_: `{a: 1, b: 2, c: 3}`

### `required`

The value of the keyword should be an array of unique strings. The data object to be valid should contain all properties with names equal to the elements in the keyword value.

**Example**

_schema_: `{type: "object", required: ["a", "b"]}`

_valid_: `{a: 1, b: 2}`, `{a: 1, b: 2, c: 3}`

_invalid_: `{}`, `{a: 1}`, `{c: 3, d: 4}`

### `properties`

The value of the keyword should be a map with keys equal to data object properties. Each value in the map should be a JSON Schema. For data object to be valid the corresponding values in data object properties should be valid according to these schemas.

**Please note**: `properties` keyword does not require that the properties mentioned in it are present in the object (see examples).

**Example**

_schema_:

```javascript
{
  type: "object",
  properties: {
    foo: {type: "string"},
    bar: {
      type: "number",
      minimum: 2
    }
  }
}
```

_valid_: `{}`, `{foo: "a"}`, `{foo: "a", bar: 2}`

_invalid_: `{foo: 1}`, `{foo: "a", bar: 1}`

### `patternProperties`

The value of this keyword should be a map where keys should be regular expressions and the values should be JSON Schemas. For data object to be valid the values in data object properties that match regular expression(s) should be valid according to the corresponding schema(s).

When the value in data object property matches multiple regular expressions it should be valid according to all the schemas for all matched regular expressions.

**Please note**:

1. `patternProperties` keyword does not require that properties matching patterns are present in the object (see examples).
2. By default, Ajv does not allow schemas where patterns in `patternProperties` match any property name in `properties` keyword - that leads to unexpected validation results. It can be allowed with option `allowMatchingProperties`. See [Strict mode](./strict-mode.md)

**Example**

_schema_:

```javascript
{
  type: "object",
  patternProperties: {
    "^fo.*$": {type: "string"},
    "^ba.*$": {type: "number"}
  }
}
```

_valid_: `{}`, `{foo: "a"}`, `{foo: "a", bar: 1}`

_invalid_: `{foo: 1}`, `{foo: "a", bar: "b"}`

### `additionalProperties`

The value of the keyword should be either a boolean or a JSON Schema.

If the value is `true` the keyword is ignored.

If the value is `false` the data object to be valid should not have "additional properties" (i.e. properties other than those used in "properties" keyword and those that match patterns in "patternProperties" keyword).

If the value is a schema for the data object to be valid the values in all "additional properties" should be valid according to this schema.

**Examples**

1.  _schema_:

    ```javascript
    {
      type: "object",
      properties: {
        foo: {type: "number"}
      },
      patternProperties: {
        "^.*r$": {type: "number"}
      },
      additionalProperties: false
    }
    ```

    _valid_: `{}`, `{foo: 1}`, `{foo: 1, bar: 2}`

    _invalid_: `{a: 3}`, `{foo: 1, baz: 3}`

2.  _schema_:

    ```javascript
    {
      type: "object",
      properties: {
        foo: {type: "number"}
      },
      patternProperties: {
        "^.*r$": {type: "number"}
      },
      additionalProperties: {type: "string"}
    }
    ```

    _valid_: `{}`, `{a: "b"}`, `{foo: 1}`, `{foo: 1, bar: 2}`, `{foo: 1, bar: 2, a: "b"}`

    _invalid_: `{a: 3}`, `{foo: 1, baz: 3}`

3.  _schema_:

    ```javascript
    {
      type: "object",
      properties: {
        foo: {type: "number"}
      },
      additionalProperties: false,
      anyOf: [
        {
          properties: {
            bar: {type: "number"}
          }
        },
        {
          properties: {
            baz: {type: "number"}
          }
        }
      ]
    }
    ```

    _valid_: `{}`, `{foo: 1}`

    _invalid_: `{bar: 2}`, `{baz: 3}`, `{foo: 1, bar: 2}`, etc.

### `dependencies`

This keyword is deprecated. The same functionality is available with keywords `dependentRequired` and `dependentSchemas`.

The value of the keyword is a map with keys equal to data object properties. Each value in the map should be either an array of unique property names ("property dependency" - see [`dependentRequired`](#`dependentrequired`) keyword) or a JSON Schema ("schema dependency" - see [`dependentSchemas`](#`dependentschemas`) keyword).

For property dependency, if the data object contains a property that is a key in the keyword value, then to be valid the data object should also contain all properties from the array of properties.

For schema dependency, if the data object contains a property that is a key in the keyword value, then to be valid the data object itself (NOT the property value) should be valid according to the schema.

**Examples**

1.  _schema (property dependency)_:

    ```javascript
    {
      type: "object",
      dependencies: {
        foo: ["bar", "baz"]
      }
    }
    ```

    _valid_: `{foo: 1, bar: 2, baz: 3}`, `{}`, `{a: 1}`

    _invalid_: `{foo: 1}`, `{foo: 1, bar: 2}`, `{foo: 1, baz: 3}`

2.  _schema (schema dependency)_:

    ```javascript
    {
      type: "object",
      dependencies: {
        foo: {
          properties: {
            bar: {type: "number"}
          }
        }
      }
    }
    ```

    _valid_: `{}`, `{foo: 1}`, `{foo: 1, bar: 2}`, `{a: 1}`

    _invalid_: `{foo: 1, bar: "a"}`

### `dependentRequired`

The value of this keyword should be a map with keys equal to data object properties. Each value in the map should be an array of unique property names.

If the data object contains a property that is a key in the keyword value, then to be valid the data object should also contain all properties from the corresponding array of properties in this keyword.

**Example**

_schema_:

```javascript
{
  type: "object",
  dependentRequired: {
    foo: ["bar", "baz"]
  }
}
```

_valid_: `{foo: 1, bar: 2, baz: 3}`, `{}`, `{a: 1}`

_invalid_: `{foo: 1}`, `{foo: 1, bar: 2}`, `{foo: 1, baz: 3}`

### `dependentSchemas`

The value of the keyword should be a map with keys equal to data object properties. Each value in the map should be a JSON Schema.

If the data object contains a property that is a key in the keyword value, then to be valid the data object itself (NOT the property value) should be valid according to the corresponding schema in this keyword.

**Example**

_schema_:

```javascript
{
  type: "object",
  dependentSchemas: {
    foo: {
      properties: {
        bar: {type: "number"}
      }
    }
  }
}
```

_valid_: `{}`, `{foo: 1}`, `{foo: 1, bar: 2}`, `{a: 1}`

_invalid_: `{foo: 1, bar: "a"}`

### `propertyNames`

The value of this keyword is a JSON Schema.

For data object to be valid each property name in this object should be valid according to this schema.

**Example**

_schema_ (requires `email` format from [ajv-formats](https://github.com/ajv-validator/ajv-formats)):

```javascript
{
  type: "object",
  propertyNames: {
    format: "email"
  }
}
```

_valid_: `{"foo@bar.com": "any", "bar@bar.com": "any"}`

_invalid_: `{foo: "any value"}`

### `unevaluatedProperties`

The value of this keyword is a JSON Schema (can be a boolean).

This schema will be applied to all properties that were not evaluated by other keywords for properties (`properties`, `patternProperties` and `additionalProperties`) in the current schema and all sub-schemas that were valid for this data instance. It includes:

- all subschemas schemas in `allOf` and `$ref` keywords
- valid sub-schemas in `oneOf` and `anyOf` keywords
- sub-schema in `if` keyword
- sub-schemas in `then` or `else` keywords that were applied based on the validation result by `if` keyword.

Some user-defined keywords can also make properties "evaluated".

**Example**

_schema_:

```javascript
{
  type: "object",
  required: ["foo"],
  properties: {foo: {type: "number"}},
  unevaluatedProperties: false,
  anyOf: [
    {
      required: ["bar"],
      properties: {bar: {type: "number"}}
    }
    {
      required: ["baz"],
      properties: {baz: {type: "number"}}
    }
  ]
}
```

_valid_: `{foo: 1, bar: 2}`, `{foo: 1, baz: 2}`, `{foo: 1, bar: 2, baz: 3}`

_invalid_:

- `{foo: 1}` - neither `bar` nor `baz` are present
- `{foo: 1, bar: 2, boo: 3}` - `boo` is unevaluated
- `{foo: 1, bar: 2, baz: "3"}` - not valid against the 2nd subschema, so `baz` is "unevaluated".

See [tests](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/master/tests/draft2019-09/unevaluatedProperties.json) for `unevaluatedProperties` keyword for other examples.

## Keywords for all types

### `enum`

The value of the keyword should be an array of unique items of any types. The data is valid if it is deeply equal to one of items in the array.

**Example**

_schema_: `{enum: [2, "foo", {foo: "bar" }, [1, 2, 3]]}`

_valid_: `2`, `"foo"`, `{foo: "bar"}`, `[1, 2, 3]`

_invalid_: `1`, `"bar"`, `{foo: "baz"}`, `[1, 2, 3, 4]`, any value not in enum

### `const`

The value of this keyword can be anything. The data is valid if it is deeply equal to the value of the keyword.

**Example**

_schema_: `{const: "foo"}`

_valid_: `"foo"`

_invalid_: any other value

The same can be achieved with `enum` keyword using the array with one item. But `const` keyword is more than just a syntax sugar for `enum`. In combination with the [\$data reference](./validation.md#data-reference) it allows to define equality relations between different parts of the data. This cannot be achieved with `enum` keyword even with `$data` reference because `$data` cannot be used in place of one item - it can only be used in place of the whole array in `enum` keyword.

**Example**

_schema_:

```javascript
{
  type: "object",
  properties: {
    foo: {type: "number"},
    bar: {const: {$data: "1/foo"}}
  }
}
```

_valid_: `{foo: 1, bar: 1}`, `{}`

_invalid_: `{foo: 1}`, `{bar: 1}`, `{foo: 1, bar: 2}`

## Compound keywords

### `not`

The value of the keyword should be a JSON Schema. The data is valid if it is invalid according to this schema.

**Example**

_schema_: `{type: "number", not: {minimum: 3}}`

_valid_: `1`, `2`

_invalid_: `3`, `4`

### `oneOf`

The value of the keyword should be an array of JSON Schemas. The data is valid if it matches exactly one JSON Schema from this array. Validators have to validate data against all schemas to establish validity according to this keyword.

**Example**

_schema_:

```javascript
{
  type: "number",
  oneOf: [{maximum: 3}, {type: "integer"}]
}
```

_valid_: `1.5`, `2.5`, `4`, `5`

_invalid_: `2`, `3`, `4.5`, `5.5`

### `anyOf`

The value of the keyword should be an array of JSON Schemas. The data is valid if it is valid according to one or more JSON Schemas in this array. Validators only need to validate data against schemas in order until the first schema matches (or until all schemas have been tried). For this reason validating against this keyword is faster than against "oneOf" keyword in most cases.

**Example**

_schema_:

```javascript
{
  type: "number",
  anyOf: [{maximum: 3}, {type: "integer"}]
}
```

_valid_: `1.5`, `2`, `2.5`, `3`, `4`, `5`

_invalid_: `4.5`, `5.5`

### `allOf`

The value of the keyword should be an array of JSON Schemas. The data is valid if it is valid according to all JSON Schemas in this array.

**Example**

_schema_:

```javascript
{
  type: "number",
  allOf: [{maximum: 3}, {type: "integer"}]
}
```

_valid_: `2`, `3`

_invalid_: `1.5`, `2.5`, `4`, `4.5`, `5`, `5.5`

### `if`/`then`/`else`

These keywords allow to implement conditional validation. Their values should be valid JSON Schemas (object or boolean).

If `if` keyword is absent, the validation succeeds.

If the data is valid against the sub-schema in `if` keyword, then the validation result is equal to the result of data validation against the sub-schema in `then` keyword (if `then` is absent, the validation succeeds).

If the data is invalid against the sub-schema in `if` keyword, then the validation result is equal to the result of data validation against the sub-schema in `else` keyword (if `else` is absent, the validation succeeds).

**Examples**

1.  _schema_:

    ```javascript
    {
      type: "object",
      if: {properties: {foo: {minimum: 10}}},
      then: {required: ["bar"]},
      else: {required: ["baz"]}
    }
    ```

    _valid_:

    - `{foo: 10, bar: true }`
    - `{}`
    - `{foo: 1, baz: true }`

    _invalid_:

    - `{foo: 10}` (`bar` is required)
    - `{foo: 10, baz: true }` (`bar` is required)
    - `{foo: 1}` (`baz` is required)

2)  _schema_:

    ```javascript
    {
      type: "integer",
      minimum: 1,
      maximum: 1000,
      if: {minimum: 100},
      then: {multipleOf: 100},
      else: {
        if: {minimum: 10},
        then": {multipleOf: 10}
      }
    }
    ```

    _valid_: `1`, `5`, `10`, `20`, `50`, `100`, `200`, `500`, `1000`

    _invalid_:

    - `-1`, `0` (<1)
    - `2000` (>1000)
    - `11`, `57`, `123` (any integer with more than one non-zero digit)
    - non-integers
