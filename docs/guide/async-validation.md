# Asynchronous validation

You can define formats and keywords that perform validation asynchronously by accessing database or some other service. You should add `async: true` in the keyword or format definition (see [addFormat](./api.md#api-addformat), [addKeyword](./api.md#api-addkeyword) and [User-defined keywords](./keywords.md)).

If your schema uses asynchronous formats/keywords or refers to some schema that contains them it should have `"$async": true` keyword so that Ajv can compile it correctly. If asynchronous format/keyword or reference to asynchronous schema is used in the schema without `$async` keyword Ajv will throw an exception during schema compilation.

::: warning Please note
All asynchronous subschemas that are referenced from the current or other schemas should have `"$async": true` keyword as well, otherwise the schema compilation will fail.
:::

Validation function for an asynchronous format/keyword should return a promise that resolves with `true` or `false` (or rejects with `new Ajv.ValidationError(errors)` if you want to return errors from the keyword function).

Ajv compiles asynchronous schemas to [async functions](http://tc39.github.io/ecmascript-asyncawait/). Async functions are supported in Node.js 7+ and all modern browsers. You can supply a transpiler as a function via `processCode` option. See [Options](./api.md#options).

The compiled validation function has `$async: true` property (if the schema is asynchronous), so you can differentiate these functions if you are using both synchronous and asynchronous schemas.

Validation result will be a promise that resolves with validated data or rejects with an exception `Ajv.ValidationError` that contains the array of validation errors in `errors` property.

Example:

```javascript
const ajv = new Ajv()

ajv.addKeyword({
  keyword: "idExists"
  async: true,
  type: "number",
  validate: checkIdExists,
})

async function checkIdExists(schema, data) {
  // this is just an example, you would want to avoid SQL injection in your code
  const rows = await sql(`SELECT id FROM ${schema.table} WHERE id = ${data}`)
  return !!rows.length // true if record is found
}

const schema = {
  $async: true,
  properties: {
    userId: {
      type: "integer",
      idExists: {table: "users"},
    },
    postId: {
      type: "integer",
      idExists: {table: "posts"},
    },
  },
}

const validate = ajv.compile(schema)

validate({userId: 1, postId: 19})
  .then(function (data) {
    console.log("Data is valid", data) // { userId: 1, postId: 19 }
  })
  .catch(function (err) {
    if (!(err instanceof Ajv.ValidationError)) throw err
    // data is invalid
    console.log("Validation errors:", err.errors)
  })
```

### Using transpilers

```javascript
const ajv = new Ajv({processCode: transpileFunc})
const validate = ajv.compile(schema) // transpiled es7 async function
validate(data).then(successFunc).catch(errorFunc)
```

See [Options](../options).
