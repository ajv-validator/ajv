---
layout: BlogPost
title: Ajv supports JSON Type Definition
date: 2021-03-07
---

JSON Type Definition (JTD) is a new specification for defining JSON structures that is very simple to use, comparing with JSON Schema, less error prone, and it is published as [RFC8927](https://datatracker.ietf.org/doc/rfc8927/).

See [Choosing schema language](https://ajv.js.org/guide/schema-language.md) for a detailed comparison between JSON Schema and JSON Type definition and [informal specification](https://ajv.js.org/json-type-definition.md).

<!-- more -->

In addition to validation, Ajv also supports:
- generation of [serializers](./docs/api.md#jtd-serialize) and [parsers](./docs/api.md#jtd-parse) from JTD schemas/ This is more efficient than native JSON serialization/parsing - you can combine JSON string parsing and validation in one function call.
- utility type [JTDSchemaType](../guide/typescript.md#utility-types-for-schemas) to convert your data type to the type of JTD schema and [JTDDataType](../guide/typescript.md#utility-type-for-jtd-data-type) to convert the type of schema to the type of data.
