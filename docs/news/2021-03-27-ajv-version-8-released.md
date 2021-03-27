---
news: true
title: Ajv version 8 is released!
date: 2021-03-27
---

Ajv version 8 has these new features:

- support of JSON Schema draft-2020-12: <a href="/json-schema.html#prefixitems">prefixItems</a> keyword and changed semantics of <a href="/json-schema.html#items-in-draft-2020-12">items</a> keyword, <a href="/guide/combining-schemas.html#extending-recursive-schemas">dynamic recursive references</a>.
- OpenAPI <a href="/json-schema.html#discriminator">discriminator</a> keyword.
- improved JSON Type Definition support:
<!-- more -->
  - errors consistent with JTD specification.
  - error objects with additional properties to simplify error handling
  - internationalized error messages with [ajv-i18n](/packages/ajv-i18n)
- TypeScript: support type unions in [JSONSchemaType](/guide/typescript.html#type-safe-unions)

See [release notes](https://github.com/ajv-validator/ajv/releases/tag/v8.0.0) for the details.

To install the new version:

```bash
npm install ajv
```

See [Getting started](/guide/getting-started.md) for code examples.
