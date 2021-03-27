# Why use AJV

## Write less code

**Ensure your data is valid as soon as it's received**

Instead of having your data validation and sanitization logic written as lengthy code, you can declare the requirements to your data with concise, easy to read and cross-platform [JSON Schema](https://json-schema.org) or [JSON Type Definition](https://jsontypedef.com) specifications and validate the data as soon as it arrives to your application.

TypeScript users can use validation functions as type guards, having type level guarantee that if your data is validated - it is correct.

Read more in [Getting started](./getting-started.md) and [Using with TypeScript](./typescript.md)

## Super fast & secure

**Compiles your schemas to optimized JavaScript code**

Ajv generates code to turn JSON Schemas into super-fast validation functions that are efficient for v8 optimization.

Currently Ajv is the fastest and the most standard compliant validator according to these benchmarks:

- [json-schema-benchmark](https://github.com/ebdrup/json-schema-benchmark) - 50% faster than the second place
- [jsck benchmark](https://github.com/pandastrike/jsck#benchmarks) - 20-190% faster
- [z-schema benchmark](https://rawgit.com/zaggino/z-schema/master/benchmark/results.html)
- [themis benchmark](https://cdn.rawgit.com/playlyfe/themis/master/benchmark/results.html)

Ajv was designed at the time when there were no validators fully complying with JSON Schema specification, aiming to achieve the best possibly validation performance via just-in-time compilation of JSON schemas to code. Ajv achieved both speed and rigour, but initially security was an afterthought - many security flaws have been fixed thanks to the reports from its users.

Ajv version 7 was rebuilt to have secure code generation embedded in its design as the primary objective - even if you use untrusted schemas (which is still not recommended) there are type-level guarantees against remote code execution.

Read more in [Code generation design](../codegen.md)

## Multi-standard

**Use JSON Type Definition or JSON Schema**

In addition to the multiple [JSON Schema](../json-schema.md) drafts, including the latest draft 2020-12, Ajv has support for [JSON Type Definition](../json-type-definition.md) - a new [RFC8927](https://datatracker.ietf.org/doc/rfc8927/) that offers a much simpler alternative to JSON Schema. Designed to be well-aligned with type systems, JTD has tools for both validation and type code generation for multiple languages.

Read more in [Choosing schema language](./schema-language.md)
