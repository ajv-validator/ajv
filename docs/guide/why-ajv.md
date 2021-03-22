# Why use AJV

## Write less code

**Ensure your data is valid as soon as it's received**

Instead of having your data validation and sanitization logic written as lengthy code, you can declare the requirements to your data with concise, easy to read and cross-platform [JSON Schema](https://json-schema.org) or [JSON Type Definition](https://jsontypedef.com) specifications and validate the data as soon as it arrives to your application.

TypeScript users can use validation functions as type guards, having type level guarantee that if your data is validated - it is correct.

Read more in [Getting started](./getting-started.md) and [Using with TypeScript](./typescript.md)

## Super fast & secure

**Compiles your schemas to optimized JavaScript code**

Ajv was designed at the time when there were no validators fully complying with JSON Schema specification, aiming to achieve the best possibly validation performance via just-in-time compilation of JSON schemas to code. Ajv achieved both speed and rigour, but initially security was an afterthought - many security flaws have been fixed thanks to the reports from its users.

Ajv version 7 was rebuilt to have secure code generation embedded in its design as the primary objective - even if you use untrusted schemas (which is still not recommended) there are type-level guarantees against remote code execution.

Read more in [Code generation design](../codegen.md)

## Multi-standard

**Use JSON Type Definition or JSON Schema**

In addition to the latest [JSON Schema](../json-schema.md) draft 2020-12, Ajv version 7.1 added support for [JSON Type Definition](../json-type-definition.md) - a new [RFC8927](https://datatracker.ietf.org/doc/rfc8927/) that offers a much simpler and less error-prone alternative to JSON Schema. Designed to be well-aligned with type systems, JTD has tools for both validation and type code generation for multiple languages.

Read more in [Choosing schema language](./schema-language.md)
