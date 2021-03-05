# Choosing schema language

[[toc]]

## Comparison

Both [JSON Schema](../json-schema.md) and [JSON Type Definition](../json-type-definition.md) are cross-platform specifications with implementations in multiple programming languages that define the shape of your JSON data.

You can see the difference between the two specifications in [Getting started](./getting-started) section examples.

This section compares their pros/cons to help decide which specification fits your application better.

### JSON Schema

- Pros
  - Wide specification adoption.
  - Used as part of OpenAPI specification.
  - Support of complex validation scenarios:
    - untagged unions and boolean logic
    - conditional schemas and dependencies
    - restrictions on the number ranges and the size of strings, arrays and objects
    - semantic validation with formats, patterns and content keywords
    - distribute strict record definitions across multiple schemas (with unevaluatedProperties)
  - Can be effectively used for validation of any JavaScript objects and configuration files.
- Cons
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

- Pros:
  - Aligned with type systems of many languages - can be used to generate type definitions and efficient parsers and serializers to/from these types.
  - Very simple, enforcing the best practices for cross-platform JSON API modelling.
  - Simple to implement, ensuring consistency across implementations.
  - Defines the shape of JSON data via strictly defined schema forms (rather than the collection of restrictions).
  - Effective support for tagged unions.
  - Designed to protect against user mistakes.
  - Approved as [RFC8927](https://datatracker.ietf.org/doc/rfc8927/)
- Cons:
  - Limited, compared with JSON Schema - no support for untagged unions<sup>\*</sup>, conditionals, references between different schema files<sup>\*\*</sup>, etc.
  - No meta-schema in the specification<sup>\*</sup>.
  - Brand new - limited industry adoption (as of January 2021).

<sup>\*</sup> Ajv defines meta-schema for JTD schemas and non-standard keyword "union" that can be used inside "metadata" object.

<sup>\*\*</sup> You can still combine schemas from multiple files in the application code.

See [JSON Type Definition](../json-type-definition.md) for more information and the list of defined schema forms.
