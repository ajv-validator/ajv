# Ajv type coercion rules

To enable type coercion pass option `coerceTypes` to Ajv with `true` or `array` (it is `false` by default). See [example](./validation.md#coercing-data-types).

The coercion rules are different from JavaScript:

- to validate user input as expected
- to have the coercion reversible
- to correctly validate cases where different types are required in subschemas (e.g., in `anyOf`).

Type coercion only happens if there is `type` keyword and if without coercion the validation would have failed. If coercion to the required type succeeds then the validation continues to other keywords, otherwise the validation fails.

If there are multiple types allowed in `type` keyword the coercion will only happen if none of the types match the data and some of the scalar types are present (coercion to/from `object`/`array` is not possible). In this case the validating function will try coercing the data to each type in order until some of them succeeds.

Application of these rules can have some unexpected consequences. Ajv may coerce the same value multiple times (this is why coercion reversibility is required) as needed at different points in the schema. This is particularly evident when using `oneOf`, which must test all of the subschemas. Ajv will coerce the type for each subschema, possibly resulting in unexpected failure if it can coerce to match more than one of the subschemas. Even if it succeeds, Ajv will not backtrack, so you'll get the type of the final coercion even if that's not the one that allowed the data to pass validation. If possible, structure your schema with `anyOf`, which won't validate subsequent subschemas as soon as it encounters one subschema that matches.

Possible type coercions:

| from&nbsp;type&nbsp;&rarr;<br>to&nbsp;type&nbsp;&darr; |                                     string                                      |                      number                       |                    boolean                     |         null         |                    array\*                     |
| ------------------------------------------------------ | :-----------------------------------------------------------------------------: | :-----------------------------------------------: | :--------------------------------------------: | :------------------: | :--------------------------------------------: |
| string                                                 |                                        -                                        |                  `x`&rarr;`""+x`                  | `false`&rarr;`"false"`<br>`true`&rarr;`"true"` |   `null`&rarr;`""`   |                 `[x]`&rarr;`x`                 |
| number /<br>integer                                    |                  Valid number /<br>integer: `x`&rarr;`+x`<br>                   |                         -                         |      `false`&rarr;`0`<br>`true`&rarr;`1`       |   `null`&rarr;`0`    |                 `[x]`&rarr;`x`                 |
| boolean                                                | `"false"`&rarr;`false`<br>`"true"`&rarr;`true`<br>`"abc"`&#8696;<br>`""`&#8696; | `0`&rarr;`false`<br>`1`&rarr;`true`<br>`x`&#8696; |                       -                        | `null`&rarr;`false`  | `[false]`&rarr;`false`<br>`[true]`&rarr;`true` |
| null                                                   |              `""`&rarr;`null`<br>`"null"`&#8696;<br>`"abc"`&#8696;              |           `0`&rarr;`null`<br>`x`&#8696;           |      `false`&rarr;`null`<br>`true`&#8696;      |          -           |              `[null]`&rarr;`null`              |
| array\*                                                |                                 `x`&rarr;`[x]`                                  |                  `x`&rarr;`[x]`                   | `false`&rarr;`[false]`<br>`true`&rarr;`[true]` | `null`&rarr;`[null]` |                       -                        |

\* Requires option `{coerceTypes: "array"}`

## Coercion from string values

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

`null` coerces to the empty string.

#### To number/integer types

`null` coerces to `0`

#### To boolean type

`null` coerces to `false`

## Coercion to and from array

These coercions require that the option `coerceTypes` is `"array"`.

If a scalar data is present and array is required, Ajv wraps scalar data in an array.

If an array with one item is present and a scalar is required, Ajv coerces array into its item.

- `"foo"` -> `[ "foo" ]`
- `[ "foo" ]` -> `"foo"`
