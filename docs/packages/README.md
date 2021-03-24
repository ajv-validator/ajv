# Extending Ajv

## Plugins

Ajv can be extended with plugins that add [user defined schema keywords](../guide/user-keywords.md), [validation formats](../guide/formats.md) or functions to process generated code. When such plugin is published as npm package it is recommended that it follows these conventions:

- it exports a function that accepts ajv instance as the first parameter - it allows using plugins with [ajv-cli](./ajv-cli.md).
- this function returns the same instance to allow chaining.
- this function can accept an optional configuration as the second parameter.

You can import `Plugin` interface from ajv if you use Typescript.

If you have published a useful plugin please submit a PR to add it to the next section.

## Related packages

- [ajv-formats](./ajv-formats.md) - formats defined in JSON Schema specification
- [ajv-keywords](./ajv-keywords) - additional validation keywords (select, typeof, etc.)
- [ajv-errors](./ajv-errors.md) - defining error messages in the schema
- [ajv-i18n](./ajv-i18n) - internationalised error messages
- [ajv-cli](./ajv-cli.md) - command line interface
- [ajv-bsontype](https://github.com/BoLaMN/ajv-bsontype) - MongoDB's bsonType formats
- [ajv-formats-draft2019](https://github.com/luzlab/ajv-formats-draft2019) - formats for draft-2019-09 that are not included in [ajv-formats](./ajv-formats.md) (`idn-hostname`, `idn-email`, `iri` and `iri-reference`)
- [ajv-merge-patch](https://github.com/ajv-validator/ajv-merge-patch) - keywords $merge and $patch
