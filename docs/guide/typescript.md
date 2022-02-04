# Using with TypeScript

[[toc]]

## Additional functionality

Ajv takes advantage of TypeScript type system to provide additional functionality that is not possible in JavaScript:

- utility types `JSONSchemaType` and `JTDSchemaType` to convert data type into the schema type to simplify writing schemas, both for [JSON Schema](../json-schema.md) (but without union support) and for [JSON Type Definition](../json-type-definition) (with tagged unions support).
- utility type `JTDDataType` to convert JSON Type Definition schema into the type of data that it defines.
- compiled validation functions are type guards that narrow the type after successful validation.
- validation errors for JSON Schema are defined as tagged unions, for type-safe error handling.
- when utility type is used, compiled JTD serializers only accept data of correct type (as they do not validate that the data is valid) and compiled parsers return correct data type.

## Utility types for schemas

For the same example as in [Getting started](./getting-started):
 - ensure strictNullChecks is true

<code-group>
<code-block title="JSON Schema">
```typescript
import Ajv, {JSONSchemaType} from "ajv"
const ajv = new Ajv()

interface MyData {
  foo: number
  bar?: string
}

const schema: JSONSchemaType<MyData> = {
  type: "object",
  properties: {
    foo: {type: "integer"},
    bar: {type: "string", nullable: true}
  },
  required: ["foo"],
  additionalProperties: false
}

// validate is a type guard for MyData - type is inferred from schema type
const validate = ajv.compile(schema)

// or, if you did not use type annotation for the schema,
// type parameter can be used to make it type guard:
// const validate = ajv.compile<MyData>(schema)

const data = {
  foo: 1,
  bar: "abc"
}

if (validate(data)) {
  // data is MyData here
  console.log(data.foo)
} else {
  console.log(validate.errors)
}
```
</code-block>

<code-block title="JSON Type Definition">
```typescript
import Ajv, {JTDSchemaType} from "ajv/dist/jtd"
const ajv = new Ajv()

interface MyData {
  foo: number
  bar?: string
}

const schema: JTDSchemaType<MyData> = {
  properties: {
    foo: {type: "int32"}
  },
  optionalProperties: {
    bar: {type: "string"}
  }
}


// validate is a type guard for MyData - type is inferred from schema type
const validate = ajv.compile(schema)

// or, if you did not use type annotation for the schema,
// type parameter can be used to make it type guard:
// const validate = ajv.compile<MyData>(schema)

const data = {
  foo: 1,
  bar: "abc"
}

if (validate(data)) {
  // data is MyData here
  console.log(data.foo)
} else {
  console.log(validate.errors)
}
```
</code-block>
</code-group>

See [this test](https://github.com/ajv-validator/ajv/tree/master/spec/types/json-schema.spec.ts) for an advanced example.

## Utility type for JTD data type

You can use JTD schema to construct the type of data using utility type `JTDDataType`

<code-group>
<code-block title="JSON Type Definition">
```typescript
import Ajv, {JTDDataType} from "ajv/dist/jtd"
const ajv = new Ajv()

const schema = {
  properties: {
    foo: {type: "int32"}
  },
  optionalProperties: {
    bar: {type: "string"}
  }
} as const

type MyData = JTDDataType<typeof schema>

// type inference is not supported for JTDDataType yet
const validate = ajv.compile<MyData>(schema)

const validData = {
  foo: 1,
  bar: "abc"
}

if (validate(validData)) {
  // data is MyData here
  console.log(validData.foo)
} else {
  console.log(validate.errors)
}
```
</code-block>
</code-group>
 

::: warning TypeScript limitation
Note that it's currently not possible for `JTDDataType` to know whether the compiler is inferring timestamps as strings or Dates, and so it conservatively types any timestamp as `string | Date`. This is accurate, but often requires extra validation on the part of the user to confirm they're getting the appropriate data type.
:::

## Type-safe error handling

With both [JSON Schema](../json-schema.md) and [JSON Type Definition](../json-type-definition.md), the validation error type is an open union, but it can be cast to tagged unions (using validation keyword as tag) for easier error handling.

Continuing the example above:

<code-group>
<code-block title="JSON Schema">
```typescript
import {DefinedError} from "ajv"

// ...

if (validate(data)) {
  // data is MyData here
  console.log(data.foo)
} else {
  // The type cast is needed, as Ajv uses a wider type to allow extension
  // You can extend this type to include your error types as needed.
  for (const err of validate.errors as DefinedError[]) {
    switch (err.keyword) {
      case "type":
        // err type is narrowed here to have "type" error params properties
        console.log(err.params.type)
      break
        // ...
    }
  }
}
```
</code-block>

<code-block title="JSON Type Definition">
```typescript
import {JTDErrorObject} from "ajv/dist/jtd"

// ...

if (validate(data)) {
  // data is MyData here
  console.log(data.foo)
} else {
  // The type cast is needed, as Ajv uses a wider type to allow extension
  // You can extend this type to include your error types as needed.
  for (const err of validate.errors as JTDErrorObject[]) {
    switch (err.keyword) {
      case "type":
        // err type is narrowed here to have "type" error params properties
        console.log(err.params.type)
      break
        // ...
    }
  }
}
```
</code-block>
</code-group>

## Type-safe parsers and serializers

With typescript, your compiled parsers and serializers can be type-safe, either taking their type from schema type or from type parameter passed to compilation functions.

This example uses the same data and schema types as above:

<code-group>
<code-block title="JSON Type Definition">
```typescript
import Ajv, {JTDSchemaType} from "ajv/dist/jtd"
const ajv = new Ajv()

interface MyData {
  foo: number
  bar?: string
}

const schema: JTDSchemaType<MyData> = {
  properties: {
    foo: {type: "int32"}
  },
  optionalProperties: {
    bar: {type: "string"}
  }
}

// serialize will only accept data compatible with MyData
const serialize = ajv.compileSerializer(schema)

// parse will return MyData or undefined
const parse = ajv.compileParser(schema)

// types of parse and serialize are inferred from schema,
// they can also be defined explicitly:
// const parse = ajv.compileParser<MyData>(schema)

const data = {
  foo: 1,
  bar: "abc"
}

const invalidData = {
  unknown: "abc"
}

console.log(serialize(data))
console.log(serialize(invalidData)) // type error

const json = '{"foo": 1, "bar": "abc"}'
const invalidJson = '{"unknown": "abc"}'

console.log(parseAndLogFoo(json)) // logs property
console.log(parseAndLogFoo(invalidJson)) // logs error and position

function parseAndLogFoo(json: string): void {
  const data = parse(json) // MyData | undefined
  if (data === undefined) {
    console.log(parse.message) // error message from the last parse call
    console.log(parse.position) // error position in string
  } else {
    // data is MyData here
    console.log(data.foo)
  }
}
```
</code-block>
</code-group>

## Type-safe unions

JSON Type Definition only supports tagged unions, so unions in JTD are fully supported for `JTDSchemaType` and `JTDDataType`.
JSON Schema is more complex and so `JSONSchemaType` has limited support for type safe unions.

`JSONSchemaType` will type check unions where each union element is fully specified as an element of an `anyOf` array or `oneOf` array.
Additionally, unions of primitives will type check appropriately if they're combined into an array `type`, e.g. `{type: ["string", "number"]}`.

::: warning TypeScript limitation
Note that due to current limitation of TypeScript, JSONSchemaType cannot verify that every element of the union is present, and the following example is still valid `const schema: JSONSchemaType<number | string> = {type: "string"}`.
:::

Here's a more detailed example showing several union types:

<code-group>
<code-block title="JSON Schema">
```typescript
import Ajv, {JSONSchemaType} from "ajv"
const ajv = new Ajv()

type MyUnion = {prop: boolean} | string | number

const schema: JSONSchemaType<MyUnion> = {
  anyOf: [
    {
      type: "object",
      properties: { prop: { type: "boolean" } },
      required: ["prop"],
    },
    {
      type: ["string", "number"]
    }
  ]
}
```
</code-block>
</code-group>
