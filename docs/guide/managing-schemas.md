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

These improvements cost slower schema compilation, and increased chance of re-compilation in case you pass a different schema object (see [#1413](https://github.com/ajv-validator/ajv/issues/1413)), so it is very important to manage schemas correctly, so they are only compiled once.

There are several approaches to manage compiled schemas.

## Standalone validation code

The motivation to pre-compile schemas:

- faster startup times
- lower memory footprint/bundle size
- compatible with strict content security policies
- almost no risk to compile schema more than once
- better for short-lived environments

See [Standalone validation code](../standalone) for the details.

There are scenarios when it can be not possible or difficult:

- dynamic or user-provided schemas - while you can do caching, it can be either difficult to implement or inefficient.
- user-defined keywords that use closures that are difficult to serialize as code.

## Compiling during initialization

The simplest approach is to compile all your schemas when the application starts, outside of the code that handles requests. It can be done simply in the module scope:

<code-group>
<code-block title="JavaScript">
```javascript
const Ajv = require("ajv").defalt
const schema_user = require("./schema_user.json")
const ajv = new Ajv()
const validate_user = ajv.compile(schema_user)





// this is just some abstract API framework
app.post("/user", async (cxt) => {
  if (validate_user(cxt.body)) {
    // create user
  } else {
    // report error
    cxt.status(400)
  }
})
```
</code-block>

<code-block title="TypeScript">
```javascript
import Ajv from "ajv"
import * as schema_user from "./schema_user.json"
const ajv = new Ajv()
const validate_user = ajv.compile<User>(schema_user)

interface User {
  username: string
}

// this is just some abstract API framework
app.post("/user", async (cxt) => {
  if (validate_user(cxt.body)) {
    // create user
  } else {
    // report error
    cxt.status(400)
  }
})
```
</code-block>
</code-group>

::: warning Please note
It recommended to use a single Ajv instance for the whole application, so if you use validation in more than one module, you should:

- require Ajv in a separate module responsible for validation
- compile all validators there
- export them to be used in multiple modules of your application
  :::

## Using Ajv instance cache

Another, more effective approach, is to use Ajv instance cache to have all compiled validators available anywhere in your application from a single import.

In this case you would have a separate module where you instantiate Ajv and use this instance in your application.

You can load all schemas and add them to Ajv instance in a single `validation` module:

<code-group>
<code-block title="validation.js">
```javascript
const Ajv = require("ajv").defalt
const schema_user = require("./schema_user.json")
const schema_document = require("./schema_document.json")
const ajv = exports.ajv = new Ajv()
ajv.addSchema(schema_user, "user")
ajv.addSchema(schema_document, "document")
```
</code-block>

<code-block title="validation.ts">
```typescript
import Ajv from "ajv"
import * as schema_user from "./schema_user.json"
import * as schema_document from "./schema_document.json"
export const ajv = new Ajv()
ajv.addSchema(schema_user, "user")
ajv.addSchema(schema_document, "document")
```
</code-block>
</code-group>

And then you can import Ajv instance and access any schema in any application module, for example `user` module:

<code-group>
<code-block title="user.js">
```javascript
const {ajv} = require("./validation")





// this is just some abstract API framework
app.post("/user", async (cxt) => {
  const validate = ajv.getSchema("user")
  if (validate(cxt.body)) {
    // create user
  } else {
    // report error
    cxt.status(400)
  }
})
```
</code-block>

<code-block title="users.ts">
```javascript
import ajv from "./validation"

interface User {
  username: string
}

// this is just some abstract API framework
app.post("/user", async (cxt) => {
  const validate = ajv.getSchema<User>("user")
  if (validate(cxt.body)) {
    // create user
  } else {
    // report error
    cxt.status(400)
  }
})
```
</code-block>
</code-group>

::: tip Please note
In the example above, schema compilation happens only once, on the first API call, not at the application start-up time. It means that the application would start a bit faster, but the first API call would be a bit slower. If this is undesirable, you could, for example, call `getSchema` for all added schemas after they are added, then when `getSchema` is called inside route handler it would simply get compiled validation function from the instance cache.
:::

### Cache key: schema vs key vs $id

In the example above, the key passed to the `addSchema` method was used to retrieve schemas from the cache. Other options are:

- use schema root $id attribute. While it usually looks like URI, it does not mean Ajv downloads it from this URI - this is simply $id used to identify and access the schema. You can though configure Ajv to download schemas on demand - see [Asynchronous schema loading](#asynchronous-schema-loading)
- use schema object itself as a key to the cache (it is possible, because Ajv uses Map). This approach is not recommended, because it would only work if you pass the same instance of the schema object that was passed to `addSchema` method - it is easy to make a mistake that would result in schema being compiled every time it is used.

### Pre-adding all schemas vs adding on demand

In the example above all schemas were added in advance. It is also possible, to add schemas as they are used - it can be helpful if there is many schemas. In this case, you need to check first whether the schema is already added by calling `getSchema` method - it would return `undefined` if not:

```javascript
const schema_user = require("./schema_user.json")
let validate = ajv.getSchema("user")
if (!validate) {
  ajv.addSchema(schema_user, "user")
  validate = ajv.getSchema("user")
}
```

If your schema has `$id` attribute, for example:

<code-group>
<code-block title="schema_user.json">
```json
{
  "$id": "https://example.com/user.json",
  "type": "object",
  "properties": {
    "username": {"type": "string"}
  },
  required: ["username"]
}
```
</code-block>
</code-group>

then the above logic can be simpler:

```javascript
const schema_user = require("./schema_user.json")
const validate = ajv.getSchema("https://example.com/user.json")
              || ajv.compile(schema_user)
```

The above is possible because when the schema has `$id` attribute `compile` method both compiles the schema (returning the validation function) and adds it to the Ajv instance cache at the same time.

### Asynchronous schema loading

There are cases when you need to have a large collection of schemas stored in some database or on the remote server. In this case you are likely to use schema `$id` as some resource identifier to retrieve it - either network URI or database ID.

You can use `compileAsync` [method](./api.md#api-compileAsync) to asynchronously load the schemas as they are compiled, loading the schemas that are referenced from compiled schemas on demand. Ajv itself does not do any IO operations, it uses the function you supply via `loadSchema` [option](./api.md#options) to load schema from the passed ID. This function should return `Promise` that resolves to the schema (you can use async function, as in the example).

Example:

```javascript
const ajv = new Ajv({loadSchema: loadSchema})

ajv.compileAsync(schema).then(function (validate) {
  const valid = validate(data)
  // ...
})

async function loadSchema(uri) {
  const res = await request.json(uri)
  if (res.statusCode >= 400) throw new Error("Loading error: " + res.statusCode)
  return res.body
}
```

::: warning Please note
[Option](./api.md#options) `missingRefs` should NOT be set to `"ignore"` or `"fail"` for asynchronous compilation to work.
:::

## Caching schemas in your code

You can maintain cache of compiled schemas in your application independently from Ajv. It can be helpful in cases when you have multiple Ajv instances because, for example:

- you need to compile different schemas with different options
- you use both JSON Schema and JSON Type Definition schemas in one application
- you have $id conflicts between different third party schemas you do not control

Whatever approach you use, you need to ensure that each schema is compiled only once.
