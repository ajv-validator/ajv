# JSON Type Definition

This document informally describes JSON Type Definition (JTD) specification to help Ajv users to start using it. For formal definition please refer to [RFC8927](https://datatracker.ietf.org/doc/rfc8927/). Please report any contradictions in this document with the specification.

To use JTD schemas you need to import a different Ajv class:

```javascript
const AjvJTD = require("ajv/dist/jtd").default
// or in TypeScript:
// import Ajv from "ajv/dist/jtd"
const ajv = new AjvJTD()
```

[[toc]]

## JTD schema forms

JTD specification defines 8 different forms that the schema for JSON can take for one of most widely used data types in JSON messages (API requests and responses).

All forms require that:

- schema is an object with different members, depending on the form
- each form can have:
  - an optional member `nullable` with a boolean value that allows data instance to be JSON `null`.
  - an optional member `metadata` with an object value that allows to pass any additional information or extend the specification (Ajv defines keyword "union" that can be used inside `metadata`)

Root schema can have member `definitions` that has a dictionary of schemas that can be references from any other schemas using form `ref`

### Type form <Badge text="primitive values" />

This form defines a primitive value.

It has a required member `type` and an optional members `nullable` and `metadata`, no other members are allowed.

`type` can have one of the following values:

- `"string"` - defines a string
- `"boolean"` - defines boolean value `true` or `false`
- `"timestamp"` - defines timestamp (JSON string, Ajv would also allow Date object with this type) according to [RFC3339](https://datatracker.ietf.org/doc/rfc3339/)
- `type` values that define integer numbers:
  - `"int8"` - signed byte value (-128 .. 127)
  - `"uint8"` - unsigned byte value (0 .. 255)
  - `"int16"` - signed word value (-32768 .. 32767),
  - `"uint16"` - unsigned word value (0 .. 65535)
  - `"int32"` - signed 32-bit integer value
  - `"uint32"` - unsigned 32-bit integer value
    `type` values that define floating point numbers:
  - `"float32"` - 32-bit real number
  - `"float64"` - 64-bit real number

Unlike JSON Schema, JTD does not allow defining values that can take one of several types, but they can be defined as `nullable`.

**Example**

```javascript
{
  type: "string"
}
```

### Enum form

This form defines a string that can take one of the values from the list (the values in the list must be unique).

It has a required member `enum` and optional members `nullable` and `metadata`, no other members are allowed.

Unlike JSON Schema, JTD does not allow defining `enum` with values of any other type than string.

**Example**

```javascript
{
  enum: ["foo", "bar"]
}
```

### Elements form <Badge text="arrays" />

This form defines a homogenous array of any size (possibly empty) with the elements that satisfy a given schema.

It has a required member `elements` (schema that elements should satisfy) and optional members `nullable` and `metadata`, no other members are allowed.

Unlike JSON Schema, the data instance must be JSON array (without using additional `type` keyword), and there is no way to enforce the restrictions that cannot be present on type level of most languages, such as array size and uniqueness of items.

**Example**

Schema:

```javascript
{
  elements: {
    type: "string"
  }
}
```

Valid data: `[]`, `["foo"]`, `["foo", "bar"]`

Invalid data: `["foo", 1]`, any type other than array

### Properties form <Badge text="objects" />

This form defines record (JSON object) that has defined required and optional properties.

It is required that this form has either `properties` member, or `optionalProperties`, or both, in which case the cannot have overlapping properties. Additional properties can be allowed by adding an optional boolean member `additionalProperties` with a value `true`. This form, as all other, can have optional `nullable` and `metadata` members.

Unlike JSON Schema, all properties defined in `properties` schema member are required, the data instance must be JSON object (without using additional `type` keyword) and by default additional properties are not allowed (with the exception of discriminator tag - see the next section). This strictness minimises user mistakes.

**Example 1.**

Schema:

```javascript
{
  properties: {
    foo: {
      type: "string"
    }
  }
}
```

Valid data: `{foo: "bar"}`

Invalid data: `{}`, `{foo: 1}`, `{foo: "bar", bar: 1}`, any type other than object

**Example 2.**

Schema:

```javascript
{
  properties: {
    foo: {type: "string"}
  },
  optionalProperties: {
    bar: {enum: ["1", "2"]}
  },
  additionalProperties: true
}
```

Valid data: `{foo: "bar"}`, `{foo: "bar", bar: "1"}`, `{foo: "bar", additional: 1}`

Invalid data: `{}`, `{foo: 1}`, `{foo: "bar", bar: "3"}`, any type other than object

**Example 3: invalid schema (overlapping required and optional properties)**

```javascript
{
  properties: {
    foo: {type: "string"}
  },
  optionalProperties: {
    foo: {type: "string"}
  }
}
```

### Discriminator form <Badge text="tagged union" />

This form defines discriminated (tagged) union of different record types.

It has required members `discriminator` and `mappings` and optional members `nullable` and `metadata`, no other members are allowed.

The string value of `discriminator` schema member contains the name of the data member that is the tag of the union. `mappings` schema member contains the dictionary of schemas that are applied according to the value of the tag member in the data. Schemas inside `mappings` must have "properties" form.

Properties forms inside `mappings` cannot be `nullable` and cannot define the same property as discriminator tag.

**Example 1.**

Schema:

```javascript
{
  discriminator: "version",
  mappings: {
    "1": {
      properties: {
        foo: {type: "string"}
      }
    },
    "2": {
      properties: {
        foo: {type: "uint8"}
      }
    }
  }
}
```

Valid data: `{version: "1", foo: "1"}`, `{version: "2", foo: 1}`

Invalid data: `{}`, `{foo: "1"}`, `{version: 1, foo: "1"}`, any type other than object

**Example 3: invalid schema (discriminator tag member defined in mappings)**

```javascript
{
  discriminator: "version",
  mappings: {
    "1": {
      properties: {
        version: {enum: ["1"]},
        foo: {type: "string"}
      }
    },
    "2": {
      properties: {
        version: {enum: ["2"]},
        foo: {type: "uint8"}
      }
    }
  }
}
```

### Values form <Badge text="dictionary" />

This form defines a homogenous dictionary where the values of members satisfy a given schema.

It has a required member `values` (schema that member values should satisfy) and optional members `nullable` and `metadata`, no other members are allowed.

Unlike JSON Schema, the data instance must be JSON object (without using additional `type` keyword), and there is no way to enforce size restrictions.

**Example**

Schema:

```javascript
{
  values: {
    type: "uint8"
  }
}
```

Valid data: `{}`, `{"foo": 1}`, `{"foo": 1, "bar": 2}`

Invalid data: `{"foo": "bar"}`, any type other than object

### Ref form <Badge text="reference definitions" />

This form defines a reference to the schema that is present in the corresponding key in the `definitions` member of the root schema.

It has a required member `ref` (member of `definitions` object in the root schema) and optional members `nullable` and `metadata`, no other members are allowed.

Unlike JSON Schema, JTD does not allow to reference:

- any schema fragment other than root level `definitions` member
- root of the schema - there is another way to define a self-recursive schema (see Example 2)
- another schema file (but you can still combine schemas from multiple files using JavaScript).

**Example 1.**

```javascript
{
  properties: {
    propFoo: {ref: "foo", nullable: true}
  },
  definitions: {
    foo: {type: "string"}
  }
}
```

**Example 2: self-referencing schema for binary tree**

```javascript
{
  ref: "tree",
  definitions: {
    tree: {
      properties: {
        value: {type: "int32"}
      },
      optionalProperties: {
        left: {ref: "tree"},
        right: {ref: "tree"}
      }
    }
  }
}
```

**Example 3: invalid schema (missing reference)**

```javascript
{
  ref: "foo",
  definitions: {
    bar: {type: "string"}
  }
}
```

### Empty form <Badge text="any data" />

Empty JTD schema defines the data instance that can be of any type, including JSON `null` (even if `nullable` member is not present). It cannot have any member other than `nullable` and `metadata`.

## JTDSchemaType

The type `JTDSchemaType` can be used to validate that the written schema matches the type you expect to validate. This type is strict such that if typescript compiles, you should require no further type guards. The downside of this is that the types that `JTDSchemaType` can verify are limited to the types that JTD can verify. If a type doesn't verify, `JTDSchemaType` should resolve to `never`, throwing an error when you try to assign to it. This means that types like `1 | 2 | 3`, or general untagged unions (outside of unions of string literals) cannot be used with `JTDSchemaType`.

### Most Schemas

Most straightforward types should work with `JTDSchemaType`, e.g.

```typescript
interface MyType {
  num: number
  optionalStr?: string
  nullableEnum: "v1.0" | "v1.2" | null
  values: Record<string, number>
}

const schema: JTDSchemaType<MyType> = {
  properties: {
    num: {type: "float64"},
    nullableEnum: {enum: ["v1.0", "v1.2"], nullable: true},
    values: {values: {type: "int32"}},
  },
  optionalProperties: {
    optionalStr: {type: "string"},
  },
}
```

will compile. Using `schema` with AJV will guarantee type safety.

### Ref Schemas

Ref schemas are a little more advanced, because the types of every definition must be specified in advance.
A simple ref schema is relatively straightforward:

```typescript
const schema: JTDSchemaType<{val: number}, {num: number}> = {
  definitions: {
    num: {type: "float64"},
  },
  properties: {
    val: {ref: "num"},
  },
}
```

note that the type of all definitions was included as a second argument to `JTDSchemaType`.

This also works for recursive schemas:

```typescript
type LinkedList = {val: number; next?: LinkedList}
const schema: JTDSchemaType<LinkedList, {node: LinkedList}> = {
  definitions: {
    node: {
      properties: {
        val: {type: "float64"},
      },
      optionalProperties: {
        next: {ref: "node"},
      },
    },
  },
  ref: "node",
}
```

### Notable Omissions

`JTDSchemaType` currently validats that if the schema compiles it will verify an accurate type, but there are a few places with potentially unexpected behavior.
`JTDSchemaType` doesn't verify the schema is correct. It won't reject schemas that definitions anywhere by the root, and it won't reject discriminator schemas that still define the descriminator in mapping properties. It also won't verify that enum schemas have every enum member as this isn't generally feasible in typescript yet.

## Extending JTD

### Metadata schema member

Each schema form may have an optional member `metadata` that JTD reserves for implementation/application specific extensions. Ajv uses this member as a location where any non-standard keywords can be used, such as:

- `union` keyword included in Ajv
- any user-defined keywords, for example keywords defined in [ajv-keywords](https://github.com/ajv-validator/ajv-keywords) package
- JSON Schema keywords, as long as their names are different from standard JTD keywords. It can be used to enable a gradual migration from JSON Schema to JTD, should it be required.

::: warning Please note
Ajv-specific extension to JTD are likely to be unsupported by other tools, so while it may simplify adoption, it undermines the cross-platform objective of using JTD. While it is ok to put some human readable information in `metadata` member, it is recommended not to add any validation logic there (even if it is supported by Ajv).
:::

Additional restrictions that Ajv enforces on `metadata` schema member:

- you cannot use standard JTD keywords there. While strictly speaking it is allowed by the specification, these keywords should be ignored inside `metadata` - the general approach of Ajv is to avoid anything that is ignored.
- you need to define all members used in `metadata` as keywords. If they are no-op it can be done with `ajv.addKeyword("my-metadata-keyword")`. This restriction can be removed by disabling [strict mode](https://github.com/ajv-validator/ajv/blob/master/docs/strict-mode.md), without affecting the strictness of JTD - unknown keywords would still be prohibited in the schema itself.

### Union keyword

Ajv defines `union` keyword that is used in the schema that validates JTD schemas ([meta-schema](https://github.com/ajv-validator/ajv/blob/master/lib/refs/jtd-schema.ts)).

This keyword can be used only inside `metadata` schema member.

::: warning Please note
This keyword is non-standard and it is not supported in other JTD tools, so it is recommended NOT to use this keyword in schemas for your data if you want them to be cross-platform.
:::

### User-defined keywords

Any user-defined keywords that can be used in JSON Schema schemas can also be used in JTD schemas, including the keywords in [ajv-keywords](https://github.com/ajv-validator/ajv-keywords) package.

::: warning Please note
It is strongly recommended to only use it to simplify migration from JSON Schema to JTD and not to use non-standard keywords in the new schemas, as these keywords are not supported by any other tools.
:::

## Validation errors

TODO
