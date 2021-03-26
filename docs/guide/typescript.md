# Using with TypeScript

[[toc]]

## Additional functionality

Ajv takes advantage of TypeScript type system to provide additional functionality that is not possible in JavaScript:

- utility types `JSONSchemaType` and `JTDSchemaType` to convert data type into the schema type to simplify writing schemas, both for [JSON Schema](../json-schema.md) (but without union support) and for [JSON Type Definition](../json-type-definition) (with tagged unions support).
- utility type `JTDDataType` to covert JSON Type Definition schema into the type of data that it defines.
- compiled validation functions are type guards that narrow the type after successful validation.
- validation errors for JSON Schema are defined as tagged unions, for type-safe error handling.
- when utility type is used, compiled JTD serializers only accept data of correct type (as they do not validate that the data is valid) and compiled parsers return correct data type.

## Utility types for schemas

For the same example as in [Getting started](./getting-started):

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
    bar: {type: "string"}
  },
  required: ["foo"],
  additionalProperties: false
}

// validate is a type guard for MyData - type is inferred from schema type
const validate = ajv.compile(schema)

// or, if you did not use type annotation for the schema,
// type parameter can be used to make it type guard:
// const validate = ajv.compile<MyData>(schema)

const validData = {
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

const validData = {
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

if (validate(data)) {
  // data is MyData here
  console.log(data.foo)
} else {
  console.log(validate.errors)
}
```
</code-block>
</code-group>

## Type-safe error handling

With [JSON Schema](../json-schema), the validation error type is an open union, but it can be cast to a tagged union (using validation keyword as tag) for easier error handling.

This is not useful with [JSON Type Definition](../json-type-definition), as it defines errors for schema forms, not for keywords.

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
