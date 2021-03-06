# Standalone validation code

[[toc]]

Ajv supports generating standalone modules with exported validation function(s), with one default export or multiple named exports, that are pre-compiled and can be used without Ajv. It is useful for several reasons:

- to reduce the browser bundle size - Ajv is not included in the bundle (although if you have a large number of schemas the bundle can become bigger - when the total size of generated validation code is bigger than Ajv code).
- to reduce the start-up time - the validation and compilation of schemas will happen during build time.
- to avoid dynamic code evaluation with Function constructor (used for schema compilation) - when it is prohibited by the browser page [Content Security Policy](./security.md#content-security-policy).

This functionality in Ajv v7 supersedes deprecated package ajv-pack that can be used with Ajv v6. All schemas, including those with recursive references, formats and user-defined keywords are supported, with few [limitations](#configuration-and-limitations).

## Usage with CLI

In most cases you would use this functionality via [ajv-cli](https://github.com/jessedc/ajv-cli) (>= 4.0.0) to generate module that exports validation function.

```sh
npm install -g ajv-cli
ajv compile -s schema.json -o validate_schema.js
```

`validate_schema.js` will contain the module exporting validation function that can be bundled into your application.

See [ajv-cli](https://github.com/jessedc/ajv-cli) docs for additional information.

## Usage from code

```sh
npm install ajv
```

```javascript
const Ajv = require("ajv") // version >= v7.0.0
const ajv = new Ajv({code: {source: true}}) // this option is required to generate standalone code
const standaloneCode = require("ajv/dist/standalone")

const schema = {
  $id: "https://example.com/object.json",
  type: "object",
  properties: {
    foo: {
      type: "string",
      pattern: "^[a-z]+$",
    },
  },
}

// 1. generate module with a single default export (CommonJS and ESM compatible):
const validate = ajv.compile(schema)
let moduleCode = standaloneCode(ajv, validate)

// 2. pass map of schema IDs to generate multiple exports,
// it avoids code duplication if schemas are mutually recursive or have some share elements:
let moduleCode = standaloneCode(ajv, {
  validateObject: "https://example.com/object.json",
})

// 3. or generate module with all schemas added to the instance (excluding meta-schemas),
// export names would use schema IDs (or keys passed to addSchema method):
let moduleCode = standaloneCode(ajv)

// now you can
// write module code to file
const fs = require("fs")
const path = require("path")
fs.writeFileSync(path.join(__dirname, "/validate.js"), moduleCode)

// ... or require module from string
const requireFromString = require("require-from-string")
const standaloneValidate = requireFromString(moduleCode) // for a single default export
```

Ajv package should still be a run-time dependency for most schemas, but generated modules can only depend on small parts of it, so the whole Ajv will not be included in the bundle (or executed) if you require the modules with standalone validation code from your application code.

## Configuration and limitations

To support standalone code generation:

- Ajv option `source.code` must be set to `true`
- only `code` and `macro` user-defined keywords are supported (see [User defined keywords](./keywords.md)).
- when `code` keywords define variables in shared scope using `gen.scopeValue`, they must provide `code` property with the code snippet. See source code of pre-defined keywords for examples in [vocabularies folder](https://github.com/ajv-validator/ajv/blob/master/lib/vocabularies).
- if formats are used in standalone code, ajv option `code.formats` should contain the code snippet that will evaluate to an object with all used formats definition - it can be a call to `require("...")` with the correct path (relative to the location of saved module):

```javascript
import myFormats from "./my-formats"
import Ajv, {_} from "ajv"
const ajv = new Ajv({
  formats: myFormats,
  code: {
    source: true,
    formats: _`require("./my-formats")`,
  },
})
```

If you only use formats from [ajv-formats](https://github.com/ajv-validator/ajv-formats) this option will be set by this package automatically.
