---
news: true
title: Ajv version 7 is released!
date: 2020-12-15
---

Ajv version 7 has these new features:

- support of JSON Schema draft-2019-09 features: <a href="/json-schema.html#keywords-for-objects">unevaluatedProperties</a> and <a href="/json-schema.html#unevaluateditems">unevaluatedItems</a>, <a href="/guide/combining-schemas.html#extending-recursive-schemas">dynamic recursive references</a> and other <a href="/json-schema.html#json-schema-draft-2019-09">additional keywords</a>.
- to reduce the mistakes in JSON schemas and unexpected validation results, <a href="/strict-mode.html">strict mode</a> is added - it prohibits ignored or ambiguous JSON Schema elements.
- to make code injection from untrusted schemas impossible, <a href="/codegen.html">code generation</a> is fully re-written to be safe and to allow code optimization (compiled schema code size is reduced by more than 10%).
<!-- more -->
- to simplify Ajv extensions, the new keyword API that is used by pre-defined keywords is available to user-defined keywords - it is much easier to define any keywords now, especially with subschemas. [ajv-keywords](https://github.com/ajv-validator/ajv-keywords) package was updated to use the new API (in [v4.0.0](https://github.com/ajv-validator/ajv-keywords/releases/tag/v4.0.0))
- schemas are compiled to ES6 code (ES5 code generation is also supported with an option).
- to improve reliability and maintainability the code is migrated to TypeScript.

**Please note**:

- the support for JSON-Schema draft-04 is removed - if you have schemas using "id" attributes you have to replace them with "\$id" (or continue using [Ajv v6](https://github.com/ajv-validator/ajv/tree/v6) that will be supported until 02/28/2021).
- all formats are separated to ajv-formats package - they have to be explicitly added if you use them.

See [release notes](https://github.com/ajv-validator/ajv/releases/tag/v7.0.0) for the details.

To install the new version:

```bash
npm install ajv
```

See [Getting started](/guide/getting-started.md) for code examples.
