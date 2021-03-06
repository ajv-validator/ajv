# Execution environments

[[toc]]

## Server-side Node.js

The main consideration for using Ajv server-side is to [manage compiled schemas](./managing-schemas) correctly, ensuring that the same schema is not compiled more than once.

## Short-lived environments

Depending on the life-time of the environments, the benefits from "compile once - validate many times" model can be limited - you can consider using [standalone validation code](../standalone).

If you have a pre-defined set of schemas, you can:

1. compile all schemas in the build step - you can either write your own script or use [ajv-cli](https://github.com/ajv-validator/ajv).
2. generate and beautify standalone validation code - you can have all your schemas exported from one file.
3. additionally, you can inline all dependencies on Ajv or ajv-formats using any bundling tools.
4. deploy compiled schemas as part of your application or library (with or without dependency on Ajv, depending on whether you did step 3 and which validation keywords are used in the schemas)

Please see [gajus/table](https://github.com/gajus/table) package that pre-compiles schemas in this way.

Even if your schemas need to be stored in the database, you can still compile schemas once and store your validation functions alongside schemas in the database as well, loading them on demand.

## Browsers

See [Content Security Policy](../security.md#content-security-policy) to decide how best to use Ajv in the browser for your use case.

Whether you compile schemas in the browser or use [standalone validation code](../standalone), it is recommended that you bundle them together with your application code.

If you need to use Ajv in several application bundles you can create a separate UMD bundles of Ajv using `npm run bundle` script.

In this case you need to load Ajv using the correct bundle, depending on which schema language and which version you need to use:

<code-group>
<code-block title="JSON Schema (draft-07)">
```html
<script src="bundle/ajv7.min.js"></script>
<script>
  ;(function () {
    const Ajv = window.ajv7.default
    const ajv = new Ajv()
  })()
</script>
```
</code-block>

<code-block title="JSON Schema (draft-2019-09)">
```html
<script src="bundle/ajv2019.min.js"></script>
<script>
  ;(function () {
    const Ajv = window.ajv2019.default
    const ajv = new Ajv()
  })()
</script>
```
</code-block>

<code-block title="JSON Type Definition">
```html
<script src="bundle/ajvJTD.min.js"></script>
<script>
  ;(function () {
    const Ajv = window.ajvJTD.default
    const ajv = new Ajv()
  })()
</script>
```
</code-block>
</code-group>

This bundle can be used with different module systems; it creates global `ajv`/`ajv2019`/`ajvJTD` if no module system is found.

The browser bundles are available on [cdnjs](https://cdnjs.com/libraries/ajv).

::: warning Please note
Some frameworks, e.g. Dojo, may redefine global require in a way that is not compatible with CommonJS module format. In this case Ajv bundle has to be loaded before the framework and then you can use global `ajv` (see issue [#234](https://github.com/ajv-validator/ajv/issues/234)).
:::

## ES5 environments

You need to:

- recompile Typescript to ES5 target - it is set to 2018 in the bundled compiled code.
- generate ES5 validation code:

```javascript
const ajv = new Ajv({code: {es5: true}})
```

See [Advanced options](https://github.com/ajv-validator/ajv/blob/master/docs/api.md#advanced-options).

## Other JavaScript environments

Ajv is used in other JavaScript environments, including Electron apps, WeChat mini-apps and many others, where the same considerations apply as above:

- compilation performance
- restrictive content security policy
- bundle size

If any of this is important, you may have better results with pre-compiled [standalone validation code](../standalone).

## Command line interface

Ajv can be used from the terminal in any operating system supported by Node.js

CLI is available as a separate npm package [ajv-cli](https://github.com/ajv-validator/ajv-cli).

It supports:

- compiling JSON Schemas to test their validity
- generating [standalone validation code](./docs/standalone.md) that exports validation function(s)
- migrating schemas to draft-07 and draft-2019-09 (using [json-schema-migrate](https://github.com/epoberezkin/json-schema-migrate))
- validating data file(s) against JSON Schema
- testing expected validity of data against JSON Schema
- referenced schemas
- user-defined meta-schemas, validation keywords and formats
- files in JSON, JSON5, YAML, and JavaScript format
- all Ajv options
- reporting changes in data after validation in [JSON-patch](https://datatracker.ietf.org/doc/rfc6902/) format
