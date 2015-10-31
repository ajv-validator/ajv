# JSON-Schema validation keywords


In a simple way, JSON schema is an object with validation keywords.

The keywords and their values define what rules the data should satisfy to be valid.


## Keywords

- [type](#type)
- [Keywords for numbers](#keywords-for-numbers)
    - [maximum/minimum and exclusiveMaximum/exclusiveMinimum](#maximum--minimum-and-exclusivemaximum--exclusiveminimum)
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
- [Keywords for objects](#keywords-for-objects)
    - [maxProperties/minProperties](#maxproperties--minproperties)
    - [required](#required)
    - [properties](#properties)
    - [patternProperties](#patternproperties)
    - [additionalProperties](#additionalproperties)
    - [dependencies](#dependencies)
- [Keywords for all types](#keywords-for-all-types)
    - [enum](#enum)
    - [not](#not)
    - [oneOf](#oneof)
    - [anyOf](#anyof)
    - [allOf](#allof)



## `type`

`type` keyword requires that the data is of certain type (or some of types). Its value can be a string (the allowed type) or an array of strings (multiple allowed types).

Type can be: number, integer, string, boolean, array, object or null.


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


All examples above are JSON schemas that only require data to be of certain type to be valid.

Most other keywords apply only to a particular type of data. If the data is of different type, the keyword will not apply and the data will be considered valid.



## Keywords for numbers


### `maximum` / `minimum` and `exclusiveMaximum` / `exclusiveMinimum`

The value of keyword `maximum` (`minimum`) should be a number. This value is the maximum (minimum) allowed value for the data to be valid.

The value of keyword `exclusiveMaximum` (`exclusiveMinimum`) should be a boolean value. These keyword cannot be used without `maximum` (`minimum`). If this keyword value is equal to `true`, the data should not be equal to the value in `maximum` (`minimum`) keyword to be valid.


__Examples__

1.  _schema_: `{ "maximum": 5 }`

    _valid_: `4`, `5`, `"abc"`, `[]`, `{}`, `null`, `true`

    _invalid_: `6`, `7`


2.  _schema_: `{ "minimum": 5 }`

    _valid_: `5`, `6`, `"abc"`, `[]`, `{}`, `null`, `true`

    _invalid_: `4`, `4.5`


3.  _schema_: `{ "minimum": 5, "exclusiveMinimum": true }`

    _valid_: `6`, `7`, `"abc"`, `[]`, `{}`, `null`, `true`

    _invalid_: `4.5`, `5`



### `multipleOf`

The value of the keyword should be a number. The data to be valid should be a multiple of the keyword value (i.e. the result of division of the data on the value should be integer).


__Examples__

1.  _schema_: `{ "multipleOf": 5 }`

    _valid_: `5`, `10`, `"abc"`, `[]`, `{}`, `null`, `true`

    _invalid_: `1`, `4`


2.  _schema_: `{ "multipleOf": 2.5 }`

    _valid_: `2.5`, `5`, `7.5`, `"abc"`, `[]`, `{}`, `null`, `true`

    _invalid_: `1`, `4`



## Keywords for strings

### `maxLength` / `minLength`

The value of the keywords should be a number. The data to be valid should have length satisfying this rule. Unicode pairs are counted as a single character.


__Examples__

1.  _schema_: `{ "maxLength": 5 }`

    _valid_: `"abc"`, `"abcde"`, `1`, `[]`, `{}`, `null`, `true`

    _invalid_: `"abcdef"`


2.  _schema_: `{ "minLength": 2 }`

    _valid_: `"ab"`, `"😀😀"`, `1`, `[]`, `{}`, `null`, `true`

    _invalid_: `"a"`, `"😀"`



### `pattern`

The value of the keyword should be a string. The data to be valid should match the regular expression defined by the keyword value.

Ajv uses `new Regex(value)` to create the regular expression that will be used to test data.


__Example__

_schema_: `{ "pattern": "[abc]+" }`

_valid_: `"a"`, `"abcd"`, `"cde"`, `1`, `[]`, `{}`, `null`, `true`

_invalid_: `"def"`, `""`



### `format`

The value of the keyword should be a string. The data to be valid should match the format with this name.

Ajv defines these formats: date, date-time, uri, email, hostname, ipv4, ipv6, regex.


__Example__

_schema_: `{ "format": "ipv4" }`

_valid_: `"192.168.0.1"`, `1`, `[]`, `{}`, `null`, `true`

_invalid_: `"abc"`



## Keywords for arrays

### `maxItems` / `minItems`

The value of the keywords should be a number. The data array to be valid should not have more (less) items than the keyword value.


__Example__

_schema_: `{ "maxItems": 3 }`

_valid_: `[]`, `[1]`, `["1", 2, "3"]`, `"abc"`, `1`, `{}`, `null`, `true`

_invalid_: `[1, 2, 3, 4]`



### `uniqueItems`

The value of the keyword should be a boolean. If the keyword value is `true`, the data array to be valid should have unique items.


__Example__

_schema_: `{ "uniqueItems": true }`

_valid_: `[]`, `[1]`, `["1", 2, "3"]`, `"abc"`, `1`, `{}`, `null`, `true`

_invalid_: `[1, 2, 1]`,  `[{ "a": 1, "b": 2 }, { "b": 2, "a": 1 }]`



### `items`

The value of the keyword should be an object or an array of objects.

If the keyword value is an object, then for the data array to be valid each item of the array should be valid according to the schema in this value. In this case the "additionalItems" keyword is ignored.

If the keyword value is an array, then items with indeces less than the number of items in the keyword should be valid according to the schemas with the same indeces. Whether additional items are valid will depend on "additionalItems" keyword.


__Examples__

1.  _schema_: `{ "items": { "type": "integer" } }`

    _valid_: `[1,2,3]`, `[]`, `1`, `"abc"`, `{}`, `null`, `true`

    _invalid_: `[1,"abc"]`


2.  _schema_: 
    ```
    {
        "items": [
            { "type": "integer" },
            { "type": "string" }
        ]
    }
    ```

    _valid_: `[1]`, `[1, "abc"]`, `[1, "abc", 2]`, `[]`, `1`, `"abc"`, `{}`, `null`, `true`

    _invalid_: `["abc", 1]`, `["abc"]`



### `additionalItems`

The value of the keyword should be a boolean or an object.

If "items" keyword is not present or it is an object, "additionalItems" keyword is ignored regardless of its value.

If "items" keyword is an array and data array has not more items than the length of "items" keyword value, "additionalItems" keyword is also ignored.

If the length of data array is bigger than the length of "items" keyword value than the result of the validation depends on the value of "additionalItems" keyword:

- `false`: data is invalid
- `true`: data is valid
- an object: data is valid if all additional items (i.e. items with indeces greater or equal than "items" keyword value length) are valid according to the schema in "assitionalItems" keyword.


__Examples__

1.  _schema_: `{ "additionalItems": { "type": "integer" } }`

    any data is valid against such schema - "additionalItems" is ignored.


2.  _schema_:
    ```
    {
        "items": { "type": "integer" },
        "additionalItems": { "type": "string" }
    }
    ```

    _valid_: `[]`, `[1, 2]`, any non-array data ("additionalItems" is ignored)

    _invalid_: `[1, "abc"]`, (any array with some items other than integers)


3.  _schema_:
    ```
    {
        "items": [
            { "type": "integer" },
            { "type": "integer" }
        ],
        "additionalItems": true
    }
    ```

    _valid_: `[]`, `[1, 2]`, `[1, 2, 3]`, `[1, 2, "abc"]`, any non-array data

    _invalid_: `["abc"]`, `[1, "abc", 3]`


4.  _schema_:
    ```
    {
        "items": [
            { "type": "integer" },
            { "type": "integer" }
        ],
        "additionalItems": { "type": "string" }
    }
    ```

    _valid_: `[]`, `[1, 2]`, `[1, 2, "abc"]`, any non-array data

    _invalid_: `["abc"]`, `[1, 2, 3]`



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

The value of the keyword should be a map with keys equal to data object properties. Each value in the map should be a JSON schema. For data object to be valid the corresponding values in data object properties should be valid according to these schemas.


__Example__

_schema_:
```
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

The value of this keyword should be a map where keys should be regular expressions and the values should be JSON schemas. For data object to be valid the values in data object properties that match regular expression(s) should be valid according to the corresponding schema(s).

When the value in data object property matches multiple regular expressions it should be valid according to all the schemas for all matched regular expressions.


__Example__

_schema_:
```
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

The value of the keyword should be either a boolean or a JSON schema.

If the value is `true` the keyword is ignored.

If the value is `false` the data object to be valid should not have "additional properties" (i.e. properties other than those used in "properties" keyword and those that match patterns in "patternProperties" keyword).

If the value is a schema for the data object to be valid the values in all "additional properties" should be valid according to this schema.


__Examples__

1.  _schema_:
    ```
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
    
2. TODO: `additionalProperties` is schema



### `dependencies`

The value of the keyword is a map with keys equal to data object properties. Each value in the map should be either an array of unique property names ("property dependency") or a JSON schema ("schema dependency").

For property dependency, if the data object contains a property that is a key in the keyword value, then to be valid the data object should also contain all properties from the array of properties.

For schema dependency, if the data object contains a property that is a key in the keyword value, then to be valid the data object itself (NOT the property value) should be valid according to the schema.


__Examples__

1.  _schema (property dependency)_:
    ```
    {
        "dependencies": {
            "foo": ["bar", "baz"]
        }
    }
    ```

    _valid_: `{"foo": 1, "bar": 2, "baz": 3}`, `{}`, `{"a": 1}`, any non-object

    _invalid_: `{"foo": 1}`, `{"foo": 1, "bar": 2}`, `{"foo": 1, "baz": 3}`


2.  _schema (schema dependency)_:
    ```
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



## Keywords for all types

### `enum`

The value of the keyword should be an array of unique items of any types. The data is valid if it is deeply equal to one of items in the array.


__Example__

_schema_: `{ "enum": [ 2, "foo", {"foo": "bar" }, [1, 2, 3] ] }`

_valid_: `2`, `"foo"`, `{"foo": "bar"}`, `[1, 2, 3]`

_invalid_: `1`, `"bar"`, `{"foo": "baz"}`, `[1, 2, 3, 4]`, any value not in the array



### `not`

The value of the keyword should be a JSON schema. The data is valid if it is invalid according to this schema.


__Example__

_schema_: `{ "not": { "minimum": 3 } }`

_valid_: `1`, `2`

_invalid_: `3`, `4`, any non-number



### `oneOf`

The value of the keyword should be an array of JSON schemas. The data is valid if it matches exactly one JSON schema from this array. Validators have to validate data against all schemas to establish validity according to this keyword.


__Example__

_schema_:
```
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

The value of the keyword should be an array of JSON schemas. The data is valid if it is valid according to one or more JSON schemas in this array. Validators only need to validate data against schemas in order until the first schema matches (or until all schemas have been tried). For this reason validating against this keyword is faster than against "oneOf" keyword in most cases.


__Example__

_schema_:
```
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

The value of the keyword should be an array of JSON schemas. The data is valid if it is valid according to all JSON schemas in this array.


__Example__

_schema_:
```
{
    "allOf": [
        { "maximum": 3 },
        { "type": "integer" }
    ]
}
```

_valid_: `2`, `3`

_invalid_: `1.5`, `2.5`, `4`, `4.5`, `5`, `5.5`, any non-number
