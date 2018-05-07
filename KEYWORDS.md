# JSON Schema validation keywords


In a simple way, JSON Schema is an object with validation keywords.

The keywords and their values define what rules the data should satisfy to be valid.


## Keywords

- [type](#type)
- [Keywords for numbers](#keywords-for-numbers)
    - [maximum / minimum and exclusiveMaximum / exclusiveMinimum](#maximum--minimum-and-exclusivemaximum--exclusiveminimum) (changed in draft-06)
    - [multipleOf](#multipleof)
- [Keywords for strings](#keywords-for-strings)
    - [maxLength/minLength](#maxlength--minlength)
    - [pattern](#pattern)
    - [format](#format)
    - [formatMaximum / formatMinimum and formatExclusiveMaximum / formatExclusiveMinimum](#formatmaximum--formatminimum-and-formatexclusivemaximum--formatexclusiveminimum-proposed) (proposed)
- [Keywords for arrays](#keywords-for-arrays)
    - [maxItems/minItems](#maxitems--minitems)
    - [uniqueItems](#uniqueitems)
    - [items](#items)
    - [additionalItems](#additionalitems)
    - [contains](#contains) (added in draft-06)
- [Keywords for objects](#keywords-for-objects)
    - [maxProperties/minProperties](#maxproperties--minproperties)
    - [required](#required)
    - [properties](#properties)
    - [patternProperties](#patternproperties)
    - [additionalProperties](#additionalproperties)
    - [dependencies](#dependencies)
    - [propertyNames](#propertynames) (added in draft-06)
    - [patternRequired](#patternrequired-proposed) (proposed)
- [Keywords for all types](#keywords-for-all-types)
    - [enum](#enum)
    - [const](#const) (added in draft-06)
- [Compound keywords](#compound-keywords)
    - [not](#not)
    - [oneOf](#oneof)
    - [anyOf](#anyof)
    - [allOf](#allof)
    - [if/then/else](#ifthenelse) (NEW in draft-07)



## `type`

`type` keyword requires that the data is of certain type (or some of types). Its value can be a string (the allowed type) or an array of strings (multiple allowed types).

Type can be: `number`, `integer`, `string`, `boolean`, `array`, `object` or `null`.


__Examples__

1.  _schema_: `{ "type": "number" }`

    _valid_: `1`, `1.5`

    _invalid_: `"abc"`, `"1"`, `[]`, `{}`, `null`, `true`


2.  _schema_: `{ "type": "integer" }`

    _valid_: `1`, `2`

    _invalid_: `"abc"`, `"1"`, `1.5`, `[]`, `{}`, `null`, `true`


3.  _schema_: `{ "type": ["number", "string"] }`

    _valid_: `1`, `1.5`, `"abc"`, `"1"`

    _invalid_: `[]`, `{}`, `null`, `true`


All examples above are JSON Schemas that only require data to be of certain type to be valid.

Most other keywords apply only to a particular type of data. If the data is of different type, the keyword will not apply and the data will be considered valid.



## Keywords for numbers


### `maximum` / `minimum` and `exclusiveMaximum` / `exclusiveMinimum`

The value of keyword `maximum` (`minimum`) should be a number. This value is the maximum (minimum) allowed value for the data to be valid.

Draft-04: The value of keyword `exclusiveMaximum` (`exclusiveMinimum`) should be a boolean value. These keyword cannot be used without `maximum` (`minimum`). If this keyword value is equal to `true`, the data should not be equal to the value in `maximum` (`minimum`) keyword to be valid.

Draft-06/07: The value of keyword `exclusiveMaximum` (`exclusiveMinimum`) should be a number. This value is the exclusive maximum (minimum) allowed value for the data to be valid (the data equal to this keyword value is invalid).

Ajv supports both draft-04 and draft-06/07 syntaxes.


__Examples__

1.  _schema_: `{ "maximum": 5 }`

    _valid_: `4`, `5`, any non-number (`"abc"`, `[]`, `{}`, `null`, `true`)

    _invalid_: `6`, `7`


2.  _schema_: `{ "minimum": 5 }`

    _valid_: `5`, `6`, any non-number (`"abc"`, `[]`, `{}`, `null`, `true`)

    _invalid_: `4`, `4.5`


3.  _schema_:
        draft-04: `{ "minimum": 5, "exclusiveMinimum": true }`
        draft-06/07: `{ "exclusiveMinimum": 5 }`

    _valid_: `6`, `7`, any non-number (`"abc"`, `[]`, `{}`, `null`, `true`)

    _invalid_: `4.5`, `5`



### `multipleOf`

The value of the keyword should be a number. The data to be valid should be a multiple of the keyword value (i.e. the result of division of the data on the value should be integer).


__Examples__

1.  _schema_: `{ "multipleOf": 5 }`

    _valid_: `5`, `10`, any non-number (`"abc"`, `[]`, `{}`, `null`, `true`)

    _invalid_: `1`, `4`


2.  _schema_: `{ "multipleOf": 2.5 }`

    _valid_: `2.5`, `5`, `7.5`, any non-number (`"abc"`, `[]`, `{}`, `null`, `true`)

    _invalid_: `1`, `4`



## Keywords for strings

### `maxLength` / `minLength`

The value of the keywords should be a number. The data to be valid should have length satisfying this rule. Unicode pairs are counted as a single character.


__Examples__

1.  _schema_: `{ "maxLength": 5 }`

    _valid_: `"abc"`, `"abcde"`, any non-string (`1`, `[]`, `{}`, `null`, `true`)

    _invalid_: `"abcdef"`


2.  _schema_: `{ "minLength": 2 }`

    _valid_: `"ab"`, `"😀😀"`, any non-string (`1`, `[]`, `{}`, `null`, `true`)

    _invalid_: `"a"`, `"😀"`



### `pattern`

The value of the keyword should be a string. The data to be valid should match the regular expression defined by the keyword value.

Ajv uses `new RegExp(value)` to create the regular expression that will be used to test data.


__Example__

_schema_: `{ "pattern": "[abc]+" }`

_valid_: `"a"`, `"abcd"`, `"cde"`, any non-string (`1`, `[]`, `{}`, `null`, `true`)

_invalid_: `"def"`, `""`



### `format`

The value of the keyword should be a string. The data to be valid should match the format with this name.

Ajv defines these formats: date, date-time, uri, email, hostname, ipv4, ipv6, regex.


__Example__

_schema_: `{ "format": "ipv4" }`

_valid_: `"192.168.0.1"`, any non-string (`1`, `[]`, `{}`, `null`, `true`)

_invalid_: `"abc"`



### `formatMaximum` / `formatMinimum` and `formatExclusiveMaximum` / `formatExclusiveMinimum` (proposed)

Defined in [ajv-keywords](https://github.com/epoberezkin/ajv-keywords) package.

The value of keyword `formatMaximum` (`formatMinimum`) should be a string. This value is the maximum (minimum) allowed value for the data to be valid as determined by `format` keyword.

Ajv defines comparison rules for formats `"date"`, `"time"` and `"date-time"`.

The value of keyword `formatExclusiveMaximum` (`formatExclusiveMinimum`) should be a boolean value. These keyword cannot be used without `formatMaximum` (`formatMinimum`). If this keyword value is equal to `true`, the data to be valid should not be equal to the value in `formatMaximum` (`formatMinimum`) keyword.


__Example__

_schema_:

```json
{
    "format": "date",
    "formatMaximum": "2016-02-06",
    "formatExclusiveMaximum": true
}
```

_valid_: `"2015-12-31"`, `"2016-02-05"`, any non-string

_invalid_: `"2016-02-06"`, `"2016-02-07"`, `"abc"`



## Keywords for arrays

### `maxItems` / `minItems`

The value of the keywords should be a number. The data array to be valid should not have more (less) items than the keyword value.


__Example__

_schema_: `{ "maxItems": 3 }`

_valid_: `[]`, `[1]`, `["1", 2, "3"]`, any non-array (`"abc"`, `1`, `{}`, `null`, `true`)

_invalid_: `[1, 2, 3, 4]`



### `uniqueItems`

The value of the keyword should be a boolean. If the keyword value is `true`, the data array to be valid should have unique items.


__Example__

_schema_: `{ "uniqueItems": true }`

_valid_: `[]`, `[1]`, `["1", 2, "3"]`, any non-array (`"abc"`, `1`, `{}`, `null`, `true`)

_invalid_: `[1, 2, 1]`,  `[{ "a": 1, "b": 2 }, { "b": 2, "a": 1 }]`



### `items`

The value of the keyword should be an object or an array of objects.

If the keyword value is an object, then for the data array to be valid each item of the array should be valid according to the schema in this value. In this case the "additionalItems" keyword is ignored.

If the keyword value is an array, then items with indices less than the number of items in the keyword should be valid according to the schemas with the same indices. Whether additional items are valid will depend on "additionalItems" keyword.


__Examples__

1.  _schema_: `{ "items": { "type": "integer" } }`

    _valid_: `[1,2,3]`, `[]`, any non-array (`1`, `"abc"`, `{}`, `null`, `true`)

    _invalid_: `[1,"abc"]`


2.  _schema_:
    ```json
    {
        "items": [
            { "type": "integer" },
            { "type": "string" }
        ]
    }
    ```

    _valid_: `[1]`, `[1, "abc"]`, `[1, "abc", 2]`, `[]`, any non-array (`1`, `"abc"`, `{}`, `null`, `true`)

    _invalid_: `["abc", 1]`, `["abc"]`



### `additionalItems`

The value of the keyword should be a boolean or an object.

If "items" keyword is not present or it is an object, "additionalItems" keyword is ignored regardless of its value.

If "items" keyword is an array and data array has not more items than the length of "items" keyword value, "additionalItems" keyword is also ignored.

If the length of data array is bigger than the length of "items" keyword value than the result of the validation depends on the value of "additionalItems" keyword:

- `false`: data is invalid
- `true`: data is valid
- an object: data is valid if all additional items (i.e. items with indices greater or equal than "items" keyword value length) are valid according to the schema in "additionalItems" keyword.


__Examples__

1.  _schema_: `{ "additionalItems": { "type": "integer" } }`

    any data is valid against such schema - "additionalItems" is ignored.


2.  _schema_:
    ```json
    {
        "items": { "type": "integer" },
        "additionalItems": { "type": "string" }
    }
    ```

    _valid_: `[]`, `[1, 2]`, any non-array ("additionalItems" is ignored)

    _invalid_: `[1, "abc"]`, (any array with some items other than integers)


3.  _schema_:
    ```json
    {
        "items": [
            { "type": "integer" },
            { "type": "integer" }
        ],
        "additionalItems": true
    }
    ```

    _valid_: `[]`, `[1, 2]`, `[1, 2, 3]`, `[1, 2, "abc"]`, any non-array

    _invalid_: `["abc"]`, `[1, "abc", 3]`


4.  _schema_:
    ```json
    {
        "items": [
            { "type": "integer" },
            { "type": "integer" }
        ],
        "additionalItems": { "type": "string" }
    }
    ```

    _valid_: `[]`, `[1, 2]`, `[1, 2, "abc"]`, any non-array

    _invalid_: `["abc"]`, `[1, 2, 3]`


### `contains`

The value of the keyword is a JSON Schema. The array is valid if it contains at least one item that is valid according to this schema.

__Example__

_schema_: `{ "contains": { "type": "integer" } }`

_valid_: `[1]`, `[1, "foo"]`, any array with at least one integer, any non-array

_invalid_: `[]`, `["foo", "bar"]`, any array without integers


The schema from the example above is equivalent to:

```json
{
    "not": {
        "type": "array",
        "items": {
            "not": { "type": "integer" }
        }
    }
}
```


## Keywords for objects

### `maxProperties` / `minProperties`

The value of the keywords should be a number. The data object to be valid should have not more (less) properties than the keyword value.


__Example__

_schema_: `{ "maxProperties": 2 }`

_valid_: `{}`, `{"a": 1}`, `{"a": "1", "b": 2}`, any non-object

_invalid_: `{"a": 1, "b": 2, "c": 3}`



### `required`

The value of the keyword should be an array of unique strings. The data object to be valid should contain all properties with names equal to the elements in the keyword value.


__Example__

_schema_: `{ "required": ["a", "b"] }`

_valid_: `{"a": 1, "b": 2}`, `{"a": 1, "b": 2, "c": 3}`, any non-object

_invalid_: `{}`, `{"a": 1}`, `{"c": 3, "d":4}`



### `properties`

The value of the keyword should be a map with keys equal to data object properties. Each value in the map should be a JSON Schema. For data object to be valid the corresponding values in data object properties should be valid according to these schemas.

__Please note__: `properties` keyword does not require that the properties mentioned in it are present in the object (see examples).

__Example__

_schema_:
```json
{
    "properties": {
        "foo": { "type": "string" },
        "bar": {
            "type": "number",
            "minimum": 2
        }
    }
}
```

_valid_: `{}`, `{"foo": "a"}`, `{"foo": "a", "bar": 2}`, any non-object

_invalid_: `{"foo": 1}`, `{"foo": "a", "bar": 1}`



### `patternProperties`

The value of this keyword should be a map where keys should be regular expressions and the values should be JSON Schemas. For data object to be valid the values in data object properties that match regular expression(s) should be valid according to the corresponding schema(s).

When the value in data object property matches multiple regular expressions it should be valid according to all the schemas for all matched regular expressions.

__Please note__: `patternProperties` keyword does not require that properties matching patterns are present in the object (see examples).


__Example__

_schema_:
```json
{
    "patternProperties": {
        "^fo.*$": { "type": "string" },
        "^ba.*$": { "type": "number" }
    }
}
```

_valid_: `{}`, `{"foo": "a"}`, `{"foo": "a", "bar": 1}`, any non-object

_invalid_: `{"foo": 1}`, `{"foo": "a", "bar": "b"}`



### `additionalProperties`

The value of the keyword should be either a boolean or a JSON Schema.

If the value is `true` the keyword is ignored.

If the value is `false` the data object to be valid should not have "additional properties" (i.e. properties other than those used in "properties" keyword and those that match patterns in "patternProperties" keyword).

If the value is a schema for the data object to be valid the values in all "additional properties" should be valid according to this schema.


__Examples__

1.  _schema_:
    ```json
    {
        "properties": {
            "foo": { "type": "number" }
        },
        "patternProperties": {
            "^.*r$": { "type": "number" }
        },
        "additionalProperties": false
    }
    ```

    _valid_: `{}`, `{"foo": 1}`, `{"foo": 1, "bar": 2}`, any non-object

    _invalid_: `{"a": 3}`, `{"foo": 1, "baz": 3}`

2. _schema_:
    ```json
    {
        "properties": {
            "foo": { "type": "number" }
        },
        "patternProperties": {
            "^.*r$": { "type": "number" }
        },
        "additionalProperties": { "type": "string" }
    }
    ```

    _valid_: `{}`, `{"a": "b"}`, `{"foo": 1}`, `{"foo": 1, "bar": 2}`, `{"foo": 1, "bar": 2, "a": "b"}`, any non-object

    _invalid_: `{"a": 3}`, `{"foo": 1, "baz": 3}`

3. _schema_:
    ```json
    {
        "properties": {
            "foo": { "type": "number" }
        },
        "additionalProperties": false,
        "anyOf": [
            {
                "properties": {
                    "bar": { "type": "number" }
                }
            },
            {
                "properties": {
                    "baz": { "type": "number" }
                }
            }
        ]
    }
    ```
    _valid_: `{}`, `{"foo": 1}`, any non-object

    _invalid_: `{"bar": 2}`, `{"baz": 3}`, `{"foo": 1, "bar": 2}`, etc.



### `dependencies`

The value of the keyword is a map with keys equal to data object properties. Each value in the map should be either an array of unique property names ("property dependency") or a JSON Schema ("schema dependency").

For property dependency, if the data object contains a property that is a key in the keyword value, then to be valid the data object should also contain all properties from the array of properties.

For schema dependency, if the data object contains a property that is a key in the keyword value, then to be valid the data object itself (NOT the property value) should be valid according to the schema.


__Examples__

1.  _schema (property dependency)_:
    ```json
    {
        "dependencies": {
            "foo": ["bar", "baz"]
        }
    }
    ```

    _valid_: `{"foo": 1, "bar": 2, "baz": 3}`, `{}`, `{"a": 1}`, any non-object

    _invalid_: `{"foo": 1}`, `{"foo": 1, "bar": 2}`, `{"foo": 1, "baz": 3}`


2.  _schema (schema dependency)_:
    ```json
    {
        "dependencies": {
            "foo": {
                "properties": {
                    "bar": { "type": "number" }
                }
            }
        }
    }
    ```

    _valid_: `{}`, `{"foo": 1}`, `{"foo": 1, "bar": 2}`, `{"a": 1}`, any non-object

    _invalid_: `{"foo": 1, "bar": "a"}`



### `propertyNames`

The value of this keyword is a JSON Schema.

For data object to be valid each property name in this object should be valid according to this schema.


__Example__

_schema_:

```json
{
    "propertyNames": { "format": "email" }
}
```

_valid_: `{"foo@bar.com": "any", "bar@bar.com": "any"}`, any non-object

_invalid_: `{"foo": "any value"}`



### `patternRequired` (proposed)

Defined in [ajv-keywords](https://github.com/epoberezkin/ajv-keywords) package.

The value of this keyword should be an array of strings, each string being a regular expression. For data object to be valid each regular expression in this array should match at least one property name in the data object.

If the array contains multiple regular expressions, more than one expression can match the same property name.

__Examples__

1.  _schema_: `{ "patternRequired": [ "f.*o" ] }`

    _valid_: `{ "foo": 1 }`, `{ "-fo-": 1 }`, `{ "foo": 1, "bar": 2 }`, any non-object

    _invalid_: `{}`, `{ "bar": 2 }`, `{ "Foo": 1 }`,

2.  _schema_: `{ "patternRequired": [ "f.*o", "b.*r" ] }`

    _valid_: `{ "foo": 1, "bar": 2 }`, `{ "foobar": 3 }`, any non-object

    _invalid_: `{}`, `{ "foo": 1 }`, `{ "bar": 2 }`



## Keywords for all types

### `enum`

The value of the keyword should be an array of unique items of any types. The data is valid if it is deeply equal to one of items in the array.


__Example__

_schema_: `{ "enum": [ 2, "foo", {"foo": "bar" }, [1, 2, 3] ] }`

_valid_: `2`, `"foo"`, `{"foo": "bar"}`, `[1, 2, 3]`

_invalid_: `1`, `"bar"`, `{"foo": "baz"}`, `[1, 2, 3, 4]`, any value not in the array



### `const`

The value of this keyword can be anything. The data is valid if it is deeply equal to the value of the keyword.

__Example__

_schema_: `{ "const": "foo" }`

_valid_: `"foo"`

_invalid_: any other value


The same can be achieved with `enum` keyword using the array with one item. But `const` keyword is more than just a syntax sugar for `enum`. In combination with the [$data reference](https://github.com/epoberezkin/ajv#data-reference) it allows to define equality relations between different parts of the data. This cannot be achieved with `enum` keyword even with `$data` reference because `$data` cannot be used in place of one item - it can only be used in place of the whole array in `enum` keyword.


__Example__

_schema_:

```json
{
    "properties": {
        "foo": { "type": "number" },
        "bar": { "const": { "$data": "1/foo" } }
    }
}
```

_valid_: `{ "foo": 1, "bar": 1 }`, `{}`

_invalid_: `{ "foo": 1 }`, `{ "bar": 1 }`, `{ "foo": 1, "bar": 2 }`



## Compound keywords

### `not`

The value of the keyword should be a JSON Schema. The data is valid if it is invalid according to this schema.


__Examples__

1.  _schema_: `{ "not": { "minimum": 3 } }`

    _valid_: `1`, `2`

    _invalid_: `3`, `4`, any non-number

2.  _schema_:

    ```json
    {
        "not": {
            "items": {
                "not": { "type": "string" }
            }
        }
    }
    ```

    _valid_: `["a"]`, `[1, "a"]`, any array containing at least one string

    _invalid_: `[]`, `[1]`, any non-array, any array not containing strings



### `oneOf`

The value of the keyword should be an array of JSON Schemas. The data is valid if it matches exactly one JSON Schema from this array. Validators have to validate data against all schemas to establish validity according to this keyword.


__Example__

_schema_:
```json
{
    "oneOf": [
        { "maximum": 3 },
        { "type": "integer" }
    ]
}
```

_valid_: `1.5`, `2.5`, `4`, `5`, any non-number

_invalid_: `2`, `3`, `4.5`, `5.5`



### `anyOf`

The value of the keyword should be an array of JSON Schemas. The data is valid if it is valid according to one or more JSON Schemas in this array. Validators only need to validate data against schemas in order until the first schema matches (or until all schemas have been tried). For this reason validating against this keyword is faster than against "oneOf" keyword in most cases.


__Example__

_schema_:
```json
{
    "anyOf": [
        { "maximum": 3 },
        { "type": "integer" }
    ]
}
```

_valid_: `1.5`, `2`, `2.5`, `3`, `4`, `5`, any non-number

_invalid_: `4.5`, `5.5`



### `allOf`

The value of the keyword should be an array of JSON Schemas. The data is valid if it is valid according to all JSON Schemas in this array.


__Example__

_schema_:
```json
{
    "allOf": [
        { "maximum": 3 },
        { "type": "integer" }
    ]
}
```

_valid_: `2`, `3`

_invalid_: `1.5`, `2.5`, `4`, `4.5`, `5`, `5.5`, any non-number



### `if`/`then`/`else`

These keywords allow to implement conditional validation. Their values should be valid JSON Schemas (object or boolean).

If `if` keyword is absent, the validation succeds.

If the data is valid against the sub-schema in `if` keyword, then the validation result is equal to the result of data validation against the sub-schema in `then` keyword (if `then` is absent, the validation succeeds).

If the data is invalid against the sub-schema in `if` keyword, then the validation result is equal to the result of data validation against the sub-schema in `else` keyword (if `else` is absent, the validation succeeds).


__Examples__

1.  _schema_:

    ```json
    {
        "if": { "properties": { "power": { "minimum": 9000 } } },
        "then": { "required": [ "disbelief" ] },
        "else": { "required": [ "confidence" ] }
    }
    ```

    _valid_:

    - `{ "power": 10000, "disbelief": true }`
    - `{}`
    - `{ "power": 1000, "confidence": true }`
    - any non-object

    _invalid_:

    - `{ "power": 10000 }` (`disbelief` is required)
    - `{ "power": 10000, "confidence": true }` (`disbelief` is required)
    - `{ "power": 1000 }` (`confidence` is required)


2.  _schema_:

    ```json
    {
        "type": "integer",
        "minimum": 1,
        "maximum": 1000,
        "if": { "minimum": 100 },
        "then": { "multipleOf": 100 },
        "else": {
            "if": { "minimum": 10 },
            "then": { "multipleOf": 10 }
        }
    }
    ```

    _valid_: `1`, `5`, `10`, `20`, `50`, `100`, `200`, `500`, `1000`

    _invalid_:

    - `-1`, `0` (<1)
    - `2000` (>1000)
    - `11`, `57`, `123` (any number with more than one non-zero digit)
    - non-integers
