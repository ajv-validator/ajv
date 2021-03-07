---
tags:
  - JTD
---
# Choosing schema language

[[toc]]

## JSON Type Definition

Ajv supports the new specification focussed on defining cross-platform types of JSON messages/payloads - JSON Type Definition (JTD). See the informal reference of [JTD schema forms](../json-type-definition) and formal specification [RFC8927](https://datatracker.ietf.org/doc/rfc8927/).

## JSON Schema

Ajv supports most widely used drafts of JSON Schema specification. Please see the informal reference of available [JSON Schema validation keywords](../json-schema) and [specification drafts](https://json-schema.org/specification.html).

### draft-04

Draft-04 is not included in Ajv v7, because of some differences it has with the following drafts:

- different schema member for schema identifier (`id` in draft-04 instead of `$id`)
- different syntax of exclusiveMaximum/Minimum

You can still use draft-04 schemas with Ajv v6 - while this is no longer actively developed, any security related issues would still be supported at least until 30/06/2021.

To install v6:

```bash
npm install ajv@6
```

You can migrate schemas from draft-04 to draft-07 using [ajv-cli](https://github.com/ajv-validator/ajv-cli).

### draft-07 (and draft-06)

These are the most widely used versions of JSON Schema specification, and they are supported with the main ajv export.

```javascript
import Ajv from "ajv"
const ajv = new Ajv()
```

If you need to support draft-06 schemas you need to add additional meta-schema, but you may just change (or remove) `$schema` attribute in your schemas - no other changes are needed:

```javascript
const draft6MetaSchema = require("ajv/dist/refs/json-schema-draft-06.json")
ajv.addMetaSchema(draft6MetaSchema)
```

### draft 2019-09 (and draft-2012-12)

The main advantage of this JSON Schema version over draft-07 is the ability to spread the definition of records that do not allow additional properties across multiple schemas. If you do not need it, you might be better off with draft-07.

To use Ajv with the support of all JSON Schema draft-2019-09/2020-12 features you need to use a different export:

```javascript
import Ajv2019 from "ajv/dist/2019"
const ajv = new Ajv2019()
```

Optionally, you can add draft-07 meta-schema, to use both draft-07 and draft-2019-09 schemas in one Ajv instance:

```javascript
const draft7MetaSchema = require("ajv/dist/refs/json-schema-draft-07.json")
ajv.addMetaSchema(draft7MetaSchema)
```

Draft-2019-09 support is provided via a separate export in order to avoid increasing the bundle and generated code size for draft-07 users.

With this import Ajv supports the following features:

- keywords [`unevaluatedProperties`](../json-schema.md#unevaluatedproperties) and [`unevaluatedItems`](../json-schema.md#unevaluateditems)
- keywords [`dependentRequired`](../json-schema.md#dependentrequired), [`dependentSchemas`](../json-schema.md#dependentschemas), [`maxContains`/`minContain`](../json-schema.md#maxcontains--mincontains)
- dynamic recursive references with [`recursiveAnchor`/`recursiveReference`] - see [Extending recursive schemas](./combining-schemas.md#extending-recursive-schemas)
- draft-2019-09 meta-schema is the default.

::: warning Please note
Supporting dynamic recursive references and `unevaluatedProperties`/`unevaluatedItems` keywords adds additional generated code even to the validation functions where these features are not used (when possible, Ajv determines which properties/items are "unevaluated" at compilation time, but support for dynamic references always adds additional generated code). If you are not using these features in your schemas it is recommended to use default Ajv export with JSON-Schema draft-07 support.
:::

## Comparison

Both [JSON Schema](../json-schema.md) and [JSON Type Definition](../json-type-definition.md) are cross-platform specifications with implementations in multiple programming languages that define the shape of your JSON data.

You can see the difference between the two specifications in [Getting started](./getting-started) section examples.

This section compares their pros/cons to help decide which specification fits your application better.

### JSON Schema

**Pros**:

- Wide specification adoption.
- Used as part of OpenAPI specification.
- Support of complex validation scenarios:
  - untagged unions and boolean logic
  - conditional schemas and dependencies
  - restrictions on the number ranges and the size of strings, arrays and objects
  - semantic validation with formats, patterns and content keywords
  - distribute strict record definitions across multiple schemas (with unevaluatedProperties)
- Can be effectively used for validation of any JavaScript objects and configuration files.

**Cons**:

- Defines the collection of restrictions on the data, rather than the shape of the data.
- No standard support for tagged unions.
- Complex and error prone for the new users (Ajv has [strict mode](../strict-mode) enabled by default to compensate for it, but it is not cross-platform).
- Some parts of specification are difficult to implement, creating the risk of implementations divergence:
  - reference resolution model
  - unevaluatedProperties/unevaluatedItems
  - dynamic recursive references
- Internet draft status (rather than RFC)

See [JSON Schema](../json-schema.md) for more information and the list of defined keywords.

### JSON Type Definition

**Pros**:

- Aligned with type systems of many languages - can be used to generate type definitions and efficient parsers and serializers to/from these types.
- Very simple, enforcing the best practices for cross-platform JSON API modelling.
- Simple to implement, ensuring consistency across implementations.
- Defines the shape of JSON data via strictly defined schema forms (rather than the collection of restrictions).
- Effective support for tagged unions.
- Designed to protect against user mistakes.
- Supports compilation of schemas to efficient [serializers and parsers](./getting-started.md#parsing-and-serializing-json) (no need to validate as a separate step)
- Approved as [RFC8927](https://datatracker.ietf.org/doc/rfc8927/)

**Cons**:

- Limited, compared with JSON Schema - no support for untagged unions<sup>\*</sup>, conditionals, references between different schema files<sup>\*\*</sup>, etc.
- No meta-schema in the specification<sup>\*</sup>.
- Brand new - limited industry adoption (as of January 2021).

<sup>\*</sup> Ajv defines meta-schema for JTD schemas and non-standard keyword "union" that can be used inside "metadata" object.

<sup>\*\*</sup> You can still combine schemas from multiple files in the application code.

See [JSON Type Definition](../json-type-definition.md) for more information and the list of defined schema forms.
