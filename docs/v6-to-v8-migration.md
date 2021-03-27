# Changes from Ajv v6.12.6 to v8.0.0

If you are migrating from v7 see [v8.0.0 release notes](https://github.com/ajv-validator/ajv/releases/tag/v8.0.0).

[[toc]]

## New features

- support new schema specifications:
  - [JSON Type Definition](./json-type-definition.md) [RFC8927](https://datatracker.ietf.org/doc/rfc8927/). See [choosing schema language](https://ajv.js.org/guide/schema-language.html) for comparison with JSON Schema.
  - JSON Schema draft-2020-12: [prefixItems](./json-schema.md#prefixitems) keyword and changed semantics of [items](./json-schema.md#items-in-draft-2020-12) keyword, [dynamic recursive references](./guide/combining-schemas.md#extending-recursive-schemas).
  - JSON Schema draft-2019-09 features: [`unevaluatedProperties`](./json-schema.md#unevaluatedproperties) and [`unevaluatedItems`](./json-schema.md#unevaluateditems), [dynamic recursive references](./guide/combining-schemas.md#extending-recursive-schemas) and other [additional keywords](./json-schema.md#json-schema-draft-2019-09).
  - OpenAPI [discriminator](./json-schema.md#discriminator) keyword.
- Compiled parsers (as fast as JSON.parse on valid JSON, but replace validation and fail much faster on invalid JSON) and serializers (10x+ faster than JSON.stringify) from JSON Type Definition schemas - see examples in [javascript](./guide/getting-started.html#parsing-and-serializing-json) and [typescript](./guide/typescript.html#type-safe-parsers-and-serializers).
- comprehensive support for [standalone validation code](./standalone.md) - compiling one or multiple schemas to standalone modules with one or multiple exports.
- to reduce the mistakes in JSON schemas and unexpected validation results, [strict mode](./strict-mode.md) is added - it prohibits ignored or ambiguous JSON Schema elements. See [Strict mode](./strict-mode.md) and [Options](./options.md) for more details.
- to make code injection from untrusted schemas impossible, [code generation](./codegen.md) is fully re-written to be type-level safe against code injection.
- to simplify Ajv extensions, the new keyword API that is used by pre-defined keywords is available to user-defined keywords - it is much easier to define any keywords now, especially with subschemas.
- schemas are compiled to ES6 code (ES5 code generation is supported with an option).
- to improve reliability and maintainability the code is migrated to TypeScript.
- separate Ajv classes from draft-07, draft-2019-09, draft-2020-12 and JSON Type Definition support with different default imports (see [Getting started](./guide/getting-started.md).

**Please note**:
- the support for JSON-Schema draft-04 is removed - if you have schemas using "id" attributes you have to replace them with "\$id" (or continue using version 6 that will be supported until 06/30/2021).
- all formats are separated to [ajv-formats](https://github.com/ajv-validator/ajv-formats) package - they have to be explicitly added if you use them.
- Ajv instance can only be created with `new` keyword, as Ajv is now ES6 class.
- browser bundles are automatically published to ajv-dist package (but still available on cdnjs.com).
- order of schema keyword validation changed - keywords that apply to all types (allOf etc.) are now validated first, before the keywords that apply to specific data types. You can still define custom keywords that apply to all types AND are validated after type-specific keywords using option `post: true` in keyword definition.
- regular expressions in keywords "pattern" and "patternProperties" are now used as if they had unicode "u" flag, as required by JSON Schema specification - it means that some regular expressions that were valid with Ajv v6 are now invalid (and vice versa).
- JSON Schema validation errors changes:
  - `dataPath` property replaced with `instancePath`
  - "should" replaced with "must" in the messages
  - property name is removed from "propertyName" keyword error message (it is still available in `error.params.propertyName`).

## Better TypeScript support

- Methods `compile` and `compileAsync` now return type-guards - see [Getting started](./guide/getting-started.md).
- Method `validate` is a type-guard.
- Better separation of asynchronous schemas on type level.
- Schema utility types to simplify writing schemas:
  - JSONSchemaType\<T\>: generates the type for JSON Schema for type interface in the type parameter.
  - JTDSchemaType\<T\>: generates the type for JSON Type Definition schema for type interface in the type parameter.
  - JTDDataType\<T\>: generates the type for data given JSON Type Definition schema type in the type parameter.

## Potential migration difficulties

- Schema compilation is now safer against code injections but slower than in v6 ([#1386](https://github.com/ajv-validator/ajv/issues/1386)) - consider using [standalone validation code](./standalone.md) if this is a problem. Validation performance in v8 is the same (or better, thanks to [code optimizations](./codegen.md#code-optimization)).
- Schema object used as a key for compiled schema function, not serialized string ([#1413](https://github.com/ajv-validator/ajv/issues/1413)) can cause schema compilation on each validation if you pass a new schema object. See [Managing schemas](./guide/managing-schemas.md) for different approaches to manage caching of compiled validation functions.
- User defined formats with standalone validation code ([#1470](https://github.com/ajv-validator/ajv/issues/1470)) require passing code snippet to [code.formats](./options.md#code) option.

## API changes

- addVocabulary - NEW method that allows to add an array of keyword definitions.
- addKeyword - keyword name should be passed as property in definition object, not as the first parameter (old API works with "deprecated" warning). Also "inline" keywords support is removed, code generation keywords can now be defined with "code" keyword - the same definition format that is used by all pre-defined keywords.
- Ajv no longer allows to create the instance without `new` keyword (it is ES6 class).
- allow `":"` in keyword names.

### Added options

- strict: true/false/"log" - enables/disables all strict mode restrictions:
  - strictSchema: **true**/false/"log" - equivalent to the combination of strictKeywords and strictDefaults in v6, with additional restrictions (see [Strict mode](./strict-mode.md)).
  - strictTypes: true/false/**"log"** - prevent mistakes related to type keywords and keyword applicability (see [Strict Types](./strict-mode.md#strict-types)).
  - strictTuples: true/false/**"log"** - prevent incomplete tuple schemas (see [Prohibit unconstrained tuples](./strict-mode.md#prohibit-unconstrained-tuples))
  - strictRequired: true/**false**/"log" - to log or fail if properties used in JSON Schema "required" are not defined in "properties" (see [Defined required properties](./strict-mode.md#defined-required-properties)).
- allowUnionTypes: false - allow multiple non-null types in "type" keyword
- allowMatchingProperties: false - allow overlap between "properties" and "patternProperties" keywords
- discriminator: true - support OpenAPI [discriminator](./json-schema.md#discriminator) keyword
- loopEnum - optimise validation of enums, similar to [loopRequired](./options.md#looprequired) option.
- validateFormats - enable format validation (`true` by default)
- code: {optimize: number|boolean} - control [code optimisation](./codegen.md#code-optimization)
- code: {es5: true} - generate ES5 code, the default is to generate ES6 code.
- code: {lines: true} - add line breaks to generated code - simplifies debugging of compiled schemas when you need it

### Changed options

- `keywords` - now expects the array of keyword definitions (old API works with "deprecated" warning).
- `strictNumbers` - true by default now.

### Removed options

- errorDataPath - was deprecated, now removed.
- format - `validateFormats: false` can be used instead, format mode can be chosen via ajv-formats package.
- nullable: `nullable` keyword is supported by default.
- jsonPointers: JSONPointers are used to report errors by default, `jsPropertySyntax: true` (deprecated) can be used if old format is needed.
- unicode: deprecated, string length correctly accounts for multi-byte characters by default.
- extendRefs: $ref siblings are validated by default (consistent with draft 2019-09), `ignoreKeywordsWithRef` (deprecated) can be used instead to ignore $ref siblings.
- missingRefs: now exception is always thrown. Pass empty schema with $id that should be ignored to ajv.addSchema.
- processCode: replaced with `code: {process: (code, schemaEnv: object) => string}`.
- sourceCode: replaced with `code: {source: true}`.
- schemaId: removed, as JSON Schema draft-04 is no longer supported.
- strictDefaults, strictKeywords: it is default now, controlled with `strict` or `strictSchema`.
- uniqueItems: '"uniqueItems" keyword is always validated.
- unknownFormats: the same can be achieved by passing true for formats that need to be ignored via `ajv.addFormat` or `formats` option.
- cache and serialize: Map is used as cache, schema object as key.
