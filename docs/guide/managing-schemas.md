# Managing schemas

[[toc]]

## Re-using validation functions

Ajv validation model is optimized for server side execution, when schema compilation happens only once and validation happens multiple times - this has a substantial performance benefit comparing with validators that interpret the schema in the process of validation.

Transition from template-based code generation in Ajv v6 to the tree-based in v7 brought:
- type-level safety against code injection via untrusted schemas
- more efficient validation code (via [tree optimizations](../codegen.md#code-optimization))
- smaller memory footprint of compiled functions (schemas are no longer serialized)
- smaller bundle size
- more maintainable code

These improvements cost slower schema compilation, and increased chance of re-compilation in case you pass a different schema object (see [#1413](https://github.com/ajv-validator/ajv/issues/1413)), so it is very important to [manage schemas correctly](./managing-schemas), so they are only compiled once, or use standalone validation code.

There are several approaches to manage compiled schemas.

## Standalone validation code

## Compiling during initialization

## Using Ajv instance cache

### Cache key: schema vs $id

### Pre-adding all schemas

### Adding schemas on-demand

### Asynchronous schema loading

TODO motivation

During asynchronous compilation remote references are loaded using supplied function. See `compileAsync` [method](./api.md#api-compileAsync) and `loadSchema` [option](./api.md#options).

Example:

```javascript
const ajv = new Ajv({loadSchema: loadSchema})

ajv.compileAsync(schema).then(function (validate) {
  const valid = validate(data)
  // ...
})

function loadSchema(uri) {
  return request.json(uri).then(function (res) {
    if (res.statusCode >= 400) throw new Error("Loading error: " + res.statusCode)
    return res.body
  })
}
```

::: warning Please note
[Option](./api.md#options) `missingRefs` should NOT be set to `"ignore"` or `"fail"` for asynchronous compilation to work.
:::

## Caching in your applications
