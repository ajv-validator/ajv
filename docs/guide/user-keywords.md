# User-defined keywords

You can extend keyword available in Ajv by defining your own keywords.

The advantages of defining keywords are:

- allow creating validation scenarios that cannot be expressed using pre-defined keywords
- simplify your schemas
- help bringing a bigger part of the validation logic to your schemas
- make your schemas more expressive, less verbose and closer to your application domain
- implement data processors that modify your data (`modifying` option MUST be used in keyword definition) and/or create side effects while the data is being validated

If a keyword is used only for side-effects and its validation result is pre-defined, use option `valid: true/false` in keyword definition to simplify both generated code (no error handling in case of `valid: true`) and your keyword functions (no need to return any validation result).

::: warning Please note
When extending JSON Schema standard with additional keywords, you have several potential concerns to be aware of:

- portability of your schemas - they would only work with JavaScript or TypeScript applications where you can use Ajv.
- additional documentation required to maintain your schemas.
  :::

::: danger Please note
While it is possible to define additional keywords for JSON Type Definition schemas (these keywords can only be used in `metadata` member of the schema), it is strongly recommended not to do it - JTD is specifically designed for cross-platform APIs.
:::

You can define keywords with [addKeyword](./api.md#api-addkeyword) method. Keywords are defined on the `ajv` instance level - new instances will not have previously defined keywords.

Ajv allows defining keywords with:

- code generation function (used by all pre-defined keywords)
- validation function
- compilation function
- macro function

Example. `range` and `exclusiveRange` keywords using compiled schema:

```javascript
ajv.addKeyword({
  keyword: "range",
  type: "number",
  schemaType: "array",
  implements: "exclusiveRange",
  compile: ([min, max], parentSchema) =>
    parentSchema.exclusiveRange === true
      ? (data) => data > min && data < max
      : (data) => data >= min && data <= max,
})

const schema = {range: [2, 4], exclusiveRange: true}
const validate = ajv.compile(schema)
console.log(validate(2.01)) // true
console.log(validate(3.99)) // true
console.log(validate(2)) // false
console.log(validate(4)) // false
```

Several keywords (typeof, instanceof, range and propertyNames) are defined in [ajv-keywords](https://github.com/ajv-validator/ajv-keywords) package - they can be used for your schemas and as a starting point for your own keywords.

See [User-defined keywords](./keywords.md) reference for more details.
