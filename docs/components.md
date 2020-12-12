# Code components

## Ajv classes

[lib/core.ts](../lib/core.ts) - core Ajv class without any keywords. All Ajv methods for managing schemas and extensions are defined in this class.

[lib/ajv.ts](../lib/ajv.ts) - subclass of Ajv core with JSON Schema draft-07 keywords.

[lib/2019.ts](../lib/2019.ts) - subclass of Ajv core with JSON Schema draft-2019-09 keywords.

## Schema compilation

[lib/compile](../lib/compile) - code for schema compilation

[lib/compile/index.ts](../lib/compile/index.ts) - the main recursive function code for schema compilation, functions for reference resolution, the interface for schema compilation context (`SchemaCxt`).

[lib/compile/context.ts](../lib/compile/context.ts) - the class for keyword code generation `KeywordCxt`. All pre-defined keywords and user-defined keywords that use `code` function are passed an instance of this class.

[lib/compile/rules.ts](../lib/compile/rules.ts) - data structure to store references to all all keyword definitions that were added to Ajv instance, organised by data type.

[lib/compile/subschema.ts](../lib/compile/subschema.ts) - creates schema context (`SchemaCxt`) to generate code for subschemas - used by all applicator keywords in [lib/vocabularies/applicator](../lib/vocabularies/applicator).

[lib/compile/codegen](../lib/compile/codegen) - the api for [code generation](./codegen.md).

[lib/compile/validate](../lib/compile/validate) - code to iterate the schema to generate code of validation function.

## Other components

[lib/standalone](../lib/standalone) - module to generate [standalone validation code](./standalone.md).

[lib/vocabularies](../lib/vocabularies) - pre-defined validation keywords.

[lib/refs](../lib/refs) - JSON Schema meta-schemas.
