# Code components

[[toc]]

## Ajv classes

[lib/core.ts](https://github.com/ajv-validator/ajv/blob/master/lib/core.ts) - core Ajv class without any keywords. All Ajv methods for managing schemas and extensions are defined in this class.

[lib/ajv.ts](https://github.com/ajv-validator/ajv/blob/master/lib/ajv.ts) - subclass of Ajv core with JSON Schema draft-07 keywords.

[lib/2019.ts](https://github.com/ajv-validator/ajv/blob/master/lib/2019.ts) - subclass of Ajv core with JSON Schema draft-2019-09 keywords.

[lib/jtd.ts](https://github.com/ajv-validator/ajv/blob/master/lib/jtd.ts) - subclass of Ajv core with JSON Type Definition support.

## Schema compilation

[lib/compile](https://github.com/ajv-validator/ajv/blob/master/lib/compile) - code for schema compilation

[lib/compile/index.ts](https://github.com/ajv-validator/ajv/blob/master/lib/compile/index.ts) - the main recursive function code for schema compilation, functions for reference resolution, the interface for schema compilation context (`SchemaCxt`).

[lib/compile/context.ts](https://github.com/ajv-validator/ajv/blob/master/lib/compile/context.ts) - the class for keyword code generation `KeywordCxt`. All pre-defined keywords and user-defined keywords that use `code` function are passed an instance of this class.

[lib/compile/rules.ts](https://github.com/ajv-validator/ajv/blob/master/lib/compile/rules.ts) - data structure to store references to all keyword definitions that were added to Ajv instance, organised by data type.

[lib/compile/subschema.ts](https://github.com/ajv-validator/ajv/blob/master/lib/compile/subschema.ts) - creates schema context (`SchemaCxt`) to generate code for subschemas - used by all applicator keywords in [lib/vocabularies/applicator](https://github.com/ajv-validator/ajv/blob/master/lib/vocabularies/applicator).

[lib/compile/codegen](https://github.com/ajv-validator/ajv/blob/master/lib/compile/codegen) - the api for [code generation](./codegen.md).

[lib/compile/validate](https://github.com/ajv-validator/ajv/blob/master/lib/compile/validate) - code to iterate the schema to generate code of validation function.

## Other components

[lib/standalone](https://github.com/ajv-validator/ajv/blob/master/lib/standalone) - module to generate [standalone validation code](./standalone.md).

[lib/vocabularies](https://github.com/ajv-validator/ajv/blob/master/lib/vocabularies) - pre-defined validation keywords.

[lib/refs](https://github.com/ajv-validator/ajv/blob/master/lib/refs) - JSON Schema meta-schemas.
