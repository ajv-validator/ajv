<img align="right" alt="Ajv logo" width="160" src="https://ajv.js.org/img/ajv.svg">

&nbsp;

# Ajv: Another JSON schema validator

The fastest JSON validator for Node.js and browser.

Supports JSON Schema draft-06/07/2019-09/2020-12 (draft-04 is supported in [version 6](https://github.com/ajv-validator/ajv/tree/v6)) and JSON Type Definition [RFC8927](https://datatracker.ietf.org/doc/rfc8927/).

[![build](https://github.com/ajv-validator/ajv/workflows/build/badge.svg)](https://github.com/ajv-validator/ajv/actions?query=workflow%3Abuild)
[![npm](https://img.shields.io/npm/v/ajv.svg)](https://www.npmjs.com/package/ajv)
[![npm (beta)](https://img.shields.io/npm/v/ajv/beta)](https://www.npmjs.com/package/ajv)
[![npm downloads](https://img.shields.io/npm/dm/ajv.svg)](https://www.npmjs.com/package/ajv)
[![Coverage Status](https://coveralls.io/repos/github/ajv-validator/ajv/badge.svg?branch=master)](https://coveralls.io/github/ajv-validator/ajv?branch=master)
[![Gitter](https://img.shields.io/gitter/room/ajv-validator/ajv.svg)](https://gitter.im/ajv-validator/ajv)
[![GitHub Sponsors](https://img.shields.io/badge/$-sponsors-brightgreen)](https://github.com/sponsors/epoberezkin)

## Platinum sponsors

[<img src="https://ajv.js.org/img/mozilla.svg" width="45%">](https://www.mozilla.org)<img src="https://ajv.js.org/img/gap.svg" width="8%">[<img src="https://ajv.js.org/img/reserved.svg" width="45%">](https://opencollective.com/ajv)

## Contributing

More than 100 people contributed to Ajv, and we would love to have you join the development. We welcome implementing new features that will benefit many users and ideas to improve our documentation.

Please review [Contributing guidelines](./CONTRIBUTING.md) and [Code components](./docs/components.md).

## Documentation

All documentation is available on the [Ajv website](https://ajv.js.org).

Some useful site links:
- [Getting started](#usage)
- [JSON Schema vs JSON Type Definition](./docs/guide/schema-language.md#comparison)
- [API reference](./docs/api.md)
- [Strict mode](./docs/strict-mode.md#strict-mode)
- [Standalone validation code](./docs/standalone.md)
- [Security considerations](./docs/security.md)
- [Command line interface](./docs/guide/environments.md#command-line-interface)
- [Frequently Asked Questions](./docs/faq.md)

## <a name="sponsors"></a>Please [sponsor Ajv development](https://github.com/sponsors/epoberezkin)

Since I asked to support Ajv development 40 people and 6 organizations contributed via GitHub and OpenCollective - this support helped receiving the MOSS grant!

Your continuing support is very important - the funds will be used to develop and maintain Ajv once the next major version is released.

Please sponsor Ajv via:

- [GitHub sponsors page](https://github.com/sponsors/epoberezkin) (GitHub will match it)
- [Ajv Open Collective️](https://opencollective.com/ajv)

Thank you.

#### Open Collective sponsors

<a href="https://opencollective.com/ajv"><img src="https://opencollective.com/ajv/individuals.svg?width=890"></a>

<a href="https://opencollective.com/ajv/organization/0/website"><img src="https://opencollective.com/ajv/organization/0/avatar.svg"></a>
<a href="https://opencollective.com/ajv/organization/1/website"><img src="https://opencollective.com/ajv/organization/1/avatar.svg"></a>
<a href="https://opencollective.com/ajv/organization/2/website"><img src="https://opencollective.com/ajv/organization/2/avatar.svg"></a>
<a href="https://opencollective.com/ajv/organization/3/website"><img src="https://opencollective.com/ajv/organization/3/avatar.svg"></a>
<a href="https://opencollective.com/ajv/organization/4/website"><img src="https://opencollective.com/ajv/organization/4/avatar.svg"></a>
<a href="https://opencollective.com/ajv/organization/5/website"><img src="https://opencollective.com/ajv/organization/5/avatar.svg"></a>
<a href="https://opencollective.com/ajv/organization/6/website"><img src="https://opencollective.com/ajv/organization/6/avatar.svg"></a>
<a href="https://opencollective.com/ajv/organization/7/website"><img src="https://opencollective.com/ajv/organization/7/avatar.svg"></a>
<a href="https://opencollective.com/ajv/organization/8/website"><img src="https://opencollective.com/ajv/organization/8/avatar.svg"></a>
<a href="https://opencollective.com/ajv/organization/9/website"><img src="https://opencollective.com/ajv/organization/9/avatar.svg"></a>

## Performance

Ajv generates code to turn JSON Schemas into super-fast validation functions that are efficient for v8 optimization.

Currently Ajv is the fastest and the most standard compliant validator according to these benchmarks:

- [json-schema-benchmark](https://github.com/ebdrup/json-schema-benchmark) - 50% faster than the second place
- [jsck benchmark](https://github.com/pandastrike/jsck#benchmarks) - 20-190% faster
- [z-schema benchmark](https://rawgit.com/zaggino/z-schema/master/benchmark/results.html)
- [themis benchmark](https://cdn.rawgit.com/playlyfe/themis/master/benchmark/results.html)

Performance of different validators by [json-schema-benchmark](https://github.com/ebdrup/json-schema-benchmark):

[![performance](https://chart.googleapis.com/chart?chxt=x,y&cht=bhs&chco=76A4FB&chls=2.0&chbh=62,4,1&chs=600x416&chxl=-1:|ajv|@exodus&#x2F;schemasafe|is-my-json-valid|djv|@cfworker&#x2F;json-schema|jsonschema&chd=t:100,69.2,51.5,13.1,5.1,1.2)](https://github.com/ebdrup/json-schema-benchmark/blob/master/README.md#performance)

## Features

- Ajv implements JSON Schema [draft-06/07/2019-09/2020-12](http://json-schema.org/) standards (draft-04 is supported in v6):
  - all validation keywords (see [JSON Schema validation keywords](./docs/json-schema.md))
  - keyword "nullable" from [Open API 3 specification](https://swagger.io/docs/specification/data-models/data-types/).
  - full support of remote references (remote schemas have to be added with `addSchema` or compiled to be available)
  - support of recursive references between schemas
  - correct string lengths for strings with unicode pairs
  - JSON Schema [formats](#formats) (with [ajv-formats](https://github.com/ajv-validator/ajv-formats) plugin).
  - [validates schemas against meta-schema](./docs/api.md#api-validateschema)
- NEW: supports [JSON Type Definition](https://datatracker.ietf.org/doc/rfc8927/):
  - all forms (see [JSON Type Definition schema forms](./docs/json-type-definition.md))
  - meta-schema for JTD schemas
  - "union" keyword and user-defined keywords (can be used inside "metadata" member of the schema)
- supports [browsers](#using-in-browser) and Node.js 0.10-14.x
- [asynchronous loading](./docs/guide/managing-schemas.md#asynchronous-schema-compilation) of referenced schemas during compilation
- "All errors" validation mode with [option allErrors](./docs/api.md#options)
- [error messages with parameters](./docs/api.md#validation-errors) describing error reasons to allow error message generation
- i18n error messages support with [ajv-i18n](https://github.com/ajv-validator/ajv-i18n) package
- [removing-additional-properties](./docs/guide/modifying-data.md#removing-additional-properties)
- [assigning defaults](./docs/guide/modifying-data.md#assigning-defaults) to missing properties and items
- [coercing data](./docs/guide/modifying-data.md#coercing-data-types) to the types specified in `type` keywords
- [user-defined keywords](#user-defined-keywords)
- additional extension keywords with [ajv-keywords](https://github.com/ajv-validator/ajv-keywords) package
- [\$data reference](./docs/guide/combining-schemas.md#data-reference) to use values from the validated data as values for the schema keywords
- [asynchronous validation](./docs/api.md#asynchronous-validation) of user-defined formats and keywords

## Install

To install version 7:

```
npm install ajv
```

## <a name="usage"></a>Getting started

Try it in the Node.js REPL: https://runkit.com/npm/ajv

In JavaScript:

```javascript
// or ESM/TypeScript import
import Ajv from "ajv"
// Node.js require:
const Ajv = require("ajv").default
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

const schema = {
  type: "object",
  properties: {
    foo: {type: "integer"},
    bar: {type: "string"}
  },
  required: ["foo"],
  additionalProperties: false,
}

const validate = ajv.compile(schema)
const valid = validate(data)
if (!valid) console.log(validate.errors)
```

Learn how to use Ajv and see more examples in the [Guide: getting started](./docs/guide/getting-started.md)

## Changes history

See [https://github.com/ajv-validator/ajv/releases](https://github.com/ajv-validator/ajv/releases)

**Please note**: [Changes in version 7.0.0](https://github.com/ajv-validator/ajv/releases/tag/v7.0.0)

[Version 6.0.0](https://github.com/ajv-validator/ajv/releases/tag/v6.0.0).

## Code of conduct

Please review and follow the [Code of conduct](./CODE_OF_CONDUCT.md).

Please report any unacceptable behaviour to ajv.validator@gmail.com - it will be reviewed by the project team.

## Security contact

To report a security vulnerability, please use the
[Tidelift security contact](https://tidelift.com/security).
Tidelift will coordinate the fix and disclosure. Please do NOT report security vulnerabilities via GitHub issues.

## Open-source software support

Ajv is a part of [Tidelift subscription](https://tidelift.com/subscription/pkg/npm-ajv?utm_source=npm-ajv&utm_medium=referral&utm_campaign=readme) - it provides a centralised support to open-source software users, in addition to the support provided by software maintainers.

## License

[MIT](./LICENSE)
