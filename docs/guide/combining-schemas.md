# Combining schemas

[[toc]]

## <a name="ref"></a>Combining schemas with $ref

You can structure your validation logic across multiple schema files and have schemas reference each other using `$ref` keyword.

Example:

```javascript
const schema = {
  $id: "http://example.com/schemas/schema.json",
  type: "object",
  properties: {
    foo: {$ref: "defs.json#/definitions/int"},
    bar: {$ref: "defs.json#/definitions/str"},
  },
}

const defsSchema = {
  $id: "http://example.com/schemas/defs.json",
  definitions: {
    int: {type: "integer"},
    str: {type: "string"},
  },
}
```

Now to compile your schema you can either pass all schemas to Ajv instance:

```javascript
const ajv = new Ajv({schemas: [schema, defsSchema]})
const validate = ajv.getSchema("http://example.com/schemas/schema.json")
```

or use `addSchema` method:

```javascript
const ajv = new Ajv()
const validate = ajv.addSchema(defsSchema).compile(schema)
```

See [Options](./api.md#options) and [addSchema](./api.md#add-schema) method.

::: tip Please note

- `$ref` is resolved as the uri-reference using schema \$id as the base URI (see the example).
- References can be recursive (and mutually recursive) to implement the schemas for different data structures (such as linked lists, trees, graphs, etc.).
- You don't have to host your schema files at the URIs that you use as schema \$id. These URIs are only used to identify the schemas, and according to JSON Schema specification validators should not expect to be able to download the schemas from these URIs.
- The actual location of the schema file in the file system is not used.
- You can pass the identifier of the schema as the second parameter of `addSchema` method or as a property name in `schemas` option. This identifier can be used instead of (or in addition to) schema \$id.
- You cannot have the same \$id (or the schema identifier) used for more than one schema - the exception will be thrown.
- You can implement dynamic resolution of the referenced schemas using `compileAsync` method. In this way you can store schemas in any system (files, web, database, etc.) and reference them without explicitly adding to Ajv instance. See [Asynchronous schema compilation](./managing-schemas.md#asynchronous-schema-compilation).
  :::

## Extending recursive schemas

While statically defined `$ref` keyword allows to split schemas to multiple files, it is difficult to extend recursive schemas - the recursive reference(s) in the original schema points to the original schema, and not to the extended one. So in JSON Schema draft-07 the only available solution to extend the recursive schema was to redefine all sections of the original schema that have recursion.

It was particularly repetitive when extending meta-schema, as it has many recursive references, but even in a schema with a single recursive reference extending it was very verbose.

JSON Schema draft-2019-09 and the upcoming draft defined the mechanism for dynamic recursion using keywords `$recursiveRef`/`$recursiveAnchor` (draft-2019-09) or `$dynamicRef`/`$dynamicAnchor` (the next JSON Schema draft) that is somewhat similar to "open recursion" in functional programming.

Consider this recursive schema with static recursion:

```javascript
const treeSchema = {
  $id: "https://example.com/tree",
  type: "object",
  required: ["data"],
  properties: {
    data: true,
    children: {
      type: "array",
      items: {$ref: "#"},
    },
  },
}
```

The only way to extend this schema to prohibit additional properties is by adding `additionalProperties` keyword right in the schema - this approach can be impossible if you do not control the source of the original schema. Ajv also provided the additional keywords in [ajv-merge-patch](https://github.com/ajv-validator/ajv-merge-patch) package to extend schemas by treating them as plain JSON data. While this approach may work for you, it is non-standard and therefore not portable.

The new keywords for dynamic recursive references allow extending this schema without modifying it:

```javascript
const treeSchema = {
  $id: "https://example.com/tree",
  $recursiveAnchor: true,
  type: "object",
  required: ["data"],
  properties: {
    data: true,
    children: {
      type: "array",
      items: {$recursiveRef: "#"},
    },
  },
}

const strictTreeSchema = {
  $id: "https://example.com/strict-tree",
  $recursiveAnchor: true,
  $ref: "tree",
  unevaluatedProperties: false,
}

import Ajv2019 from "ajv/dist/2019"
// const Ajv2019 = require("ajv/dist/2019").default
const ajv = new Ajv2019({
  schemas: [treeSchema, strictTreeSchema],
})
const validate = ajv.getSchema("https://example.com/strict-tree")
```

See [dynamic-refs](../spec/dynamic-ref.spec.ts) test for the example using `$dynamicAnchor`/`$dynamicRef`.

At the moment Ajv implements the spec for dynamic recursive references with these limitations:

- `$recursiveAnchor`/`$dynamicAnchor` can only be used in the schema root.
- `$recursiveRef`/`$dynamicRef` can only be hash fragments, without URI.

Ajv also does not support dynamic references in [asynchronous schemas](#asynchronous-validation) (Ajv extension) - it is assumed that the referenced schema is synchronous, and there is no validation-time check for it.

## $data reference

With `$data` option you can use values from the validated data as the values for the schema keywords. See [proposal](https://github.com/json-schema-org/json-schema-spec/issues/51) for more information about how it works.

`$data` reference is supported in the keywords: const, enum, format, maximum/minimum, exclusiveMaximum / exclusiveMinimum, maxLength / minLength, maxItems / minItems, maxProperties / minProperties, formatMaximum / formatMinimum, formatExclusiveMaximum / formatExclusiveMinimum, multipleOf, pattern, required, uniqueItems.

The value of "$data" should be a [JSON-pointer](https://datatracker.ietf.org/doc/rfc6901/) to the data (the root is always the top level data object, even if the $data reference is inside a referenced subschema) or a [relative JSON-pointer](http://tools.ietf.org/html/draft-luff-relative-json-pointer-00) (it is relative to the current point in data; if the \$data reference is inside a referenced subschema it cannot point to the data outside of the root level for this subschema).

Examples.

This schema requires that the value in property `smaller` is less or equal than the value in the property larger:

```javascript
const ajv = new Ajv({$data: true})

const schema = {
  properties: {
    smaller: {
      type: "number",
      maximum: {$data: "1/larger"},
    },
    larger: {type: "number"},
  },
}

const validData = {
  smaller: 5,
  larger: 7,
}

ajv.validate(schema, validData) // true
```

This schema requires that the properties have the same format as their field names:

```javascript
const schema = {
  additionalProperties: {
    type: "string",
    format: {$data: "0#"},
  },
}

const validData = {
  "date-time": "1963-06-19T08:30:06.283185Z",
  email: "joe.bloggs@example.com",
}
```

`$data` reference is resolved safely - it won't throw even if some property is undefined. If `$data` resolves to `undefined` the validation succeeds (with the exclusion of `const` keyword). If `$data` resolves to incorrect type (e.g. not "number" for maximum keyword) the validation fails.

## $merge and $patch keywords

With the package [ajv-merge-patch](https://github.com/ajv-validator/ajv-merge-patch) you can use the keywords `$merge` and `$patch` that allow extending JSON Schemas with patches using formats [JSON Merge Patch (RFC 7396)](https://datatracker.ietf.org/doc/rfc7396/) and [JSON Patch (RFC 6902)](https://datatracker.ietf.org/doc/rfc6902/).

To add keywords `$merge` and `$patch` to Ajv instance use this code:

```javascript
require("ajv-merge-patch")(ajv)
```

Examples.

Using `$merge`:

```javascript
{
  $merge: {
    source: {
      type: "object",
      properties: {p: {type: "string"}},
      additionalProperties: false
    },
    with: {
      properties: {q: {type: "number"}}
    }
  }
}
```

Using `$patch`:

```javascript
{
  $patch: {
    source: {
      type: "object",
      properties: {p: {type: "string"}},
      additionalProperties: false
    },
    with: [{op: "add", path: "/properties/q", value: {type: "number"}}]
  }
}
```

The schemas above are equivalent to this schema:

```javascript
{
  type: "object",
  properties: {
    p: {type: "string"},
    q: {type: "number"}
  },
  additionalProperties: false
}
```

The properties `source` and `with` in the keywords `$merge` and `$patch` can use absolute or relative `$ref` to point to other schemas previously added to the Ajv instance or to the fragments of the current schema.

See the package [ajv-merge-patch](https://github.com/ajv-validator/ajv-merge-patch) for more information.
