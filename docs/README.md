# Ajv JSON Validator

Safety, security and reliability for JavaScript applications

## Ajv News

This section will include the last update and the headlines of several previous updates, e.g. these sections:

https://github.com/ajv-validator/ajv#using-version-7

https://github.com/ajv-validator/ajv#mozilla-moss-grant-and-openjs-foundation

### Write less code

**Ensure your data is valid once it's received**

Instead of having your data validation and sanitization logic scattered around your code, you can express the requirements to your data with concise, easy to read and cross-platform [JSON Schema](https://json-schema.org) or [JSON Type Definition](https://jsontypedef.com) specifications and validate the data as soon as it arrives to your application. TypeScript users can use validation functions as type guards, having type level guarantee that if your data is validated - it is correct.

### Super fast and secure

**The fastest and the most secure JSON validator**

Ajv was designed at the time when there were no validators fully complying with JSON Schema specification, aiming to achieve the best possibly validation performance via just-in-time compilation of JSON schemas to code. Ajv achieved both speed and rigour, but initially security was an afterthought - many security flaws have been fixed thanks to the reports from its users. Ajv version 7 was rebuilt to have secure code generation embedded in its design as the primary objective - even if you use untrusted schemas (which is still not recommended) there are type-level guarantees against remote code execution.

### Multi-specification

**Choose your JSON schema standard**

In addition to the latest JSON Schema draft 2020-12, Ajv version 8 added support for JSON Type Definition - a new [RFC8927](https://datatracker.ietf.org/doc/rfc8927/) that offers a much simpler and less error-prone alternative to JSON Schema. Designed to be well-aligned with type systems, JTD has tools for both validation and type code generation for multiple languages.

## Introduction (no section heading)

Ajv is a widely used library that provides reliability, safety and security to millions of JavaScript applications and other libraries. It can be used in all JavaScript environments - node.js, browsers, Electron apps, etc. If your environment or security policy prohibit run-time function construction you can compile your schemas during build time into a standalone validation code (it may still have dependencies on small parts of Ajv code, but doesn't use the whole library) - since version 7 it is fully supported for all JSON schemas.

Installation

Usage example / or small playground

Try in the playground (TBC)

## Who uses Ajv

## Contributors

Ajv is free to use and open-source that many developers contributed to. Join us!
