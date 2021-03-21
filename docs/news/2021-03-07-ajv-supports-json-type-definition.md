---
news: true
title: Ajv supports JSON Type Definition
date: 2021-03-07
---

JSON Type Definition (JTD) is a new specification for defining JSON structures that is very simple to use, comparing with JSON Schema, less error prone, and it is published as [RFC8927](https://datatracker.ietf.org/doc/rfc8927/).

See <a href="/guide/schema-language.html">Choosing schema language</a> for a detailed comparison between JSON Schema and JSON Type definition and <a href="/json-type-definition.html">informal specification</a>.

<!-- more -->

In addition to validation, Ajv also supports:
- generation of [serializers](/api.html#jtd-serialize) and [parsers](/api.html#jtd-parse) from JTD schemas/ This is more efficient than native JSON serialization/parsing - you can combine JSON string parsing and validation in one function call.
- utility type [JTDSchemaType](/guide/typescript.html#utility-types-for-schemas) to convert your data type to the type of JTD schema and [JTDDataType](/guide/typescript.html#utility-type-for-jtd-data-type) to convert the type of schema to the type of data.
