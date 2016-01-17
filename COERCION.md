# Ajv type coercion rules

The coercion rules are different from JavaScript:
- to validate user input as expected
- to have the coercion reversible
- to correctly validate cases where different types are required in subschemas.

Type coercion only happens if there is `type` keyword and if without coercion the validation would have failed. If coercion to the required type succeeds then the validation continues to other keywords, otherwise the validation fails.

If there are multiple types allowed in `type` keyword the coercion will only happen if none of the types match the data and some of the scalar types are present (coercion to/from `object`/`array` is not possible). In this case the validating function will try coercing the data to each type in order until some of them succeeds.

The table below summarises possible type coercions.

|from&nbsp;type&nbsp;&rarr;<br>to&nbsp;type&nbsp;&darr;|string|number|bolean|null|
|---|:-:|:-:|:-:|:-:|
|string      |-|`x`&rarr;`""+x`|`false`&rarr;`"false"`<br>`true`&rarr;`"true"`|`null`&rarr;`""`|
|number /<br>integer|Valid number /<br>integer: `x`&rarr;`+x`<br>|-|`false`&rarr;`0`<br>`true`&rarr;`1`|`null`&rarr;`0`|
|boolean     |`"false"`&rarr;`false`<br>`"true"`&rarr;`true`<br>`"abc"`&nrarr;<br>`""`&nrarr;|`0`&rarr;`false`<br>`1`&rarr;`true`<br>`x`&nrarr;|-|`null`&rarr;`false`|
|null        |`""`&rarr;`null`<br>`"null"`&nrarr;<br>`"abc"`&nrarr;|`0`&rarr;`null`<br>`x`&nrarr;|`false`&rarr;`null`<br>`true`&nrarr;|-|


## Coersion from string values

#### To number type

Coercion to `number` is possible if the string is a valid number, `+data` is used.


#### To integer type

Coercion to `integer` is possible if the string is a valid number without fractional part (`data % 1 === 0`).


#### To boolean type

Unlike JavaScript, only these strings can be coerced to `boolean`:
- `"true"` -> `true`
- `"false"` -> `false`


#### To null type

Empty string is coerced to `null`, other strings can't be coerced.


## Coercion from number values

#### To string type

Always possible, `'' + data` is used


#### To boolean type

Unlike JavaScript, only these numbers can be coerced to `boolean`:
- `1` -> `true`
- `0` -> `false`


#### To null type

`0` coerces to `null`, other numbers can't be coerced.


## Coercion from boolean values

#### To string type

- `true` -> `"true"`
- `false` -> `"false"`


#### To number/integer types

- `true` -> `1`
- `false` -> `0`


#### To null type

`false` coerces to `null`, `true` can't be coerced.


## Coercion from null

#### To string type

`null` coerses to the empty string.


#### To number/integer types

`null` coerces to `0`


#### To boolean type

`null` coerces to `false`
