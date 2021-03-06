# Getting started

[[toc]]

## Install

::: tip Node REPL
You can try Ajv without installing it in the Node.js REPL: [https://runkit.com/npm/ajv](https://runkit.com/npm/ajv)
:::

To install Ajv version 7:

```bash
npm install ajv
```

If you need to use Ajv with [JSON Schema draft-04](./schema-language#draft-04), you need to install Ajv version 6:

```bash
npm install ajv@6
```

See [Contributing](../CONTRIBUTING.md) on how to run the tests locally

## Basic data validation

Ajv takes a schema for your JSON data and converts it into a very efficient JavaScript code
that validates your data according to the schema. To create schema you can use either
[JSON Schema](../json-schema) or [JSON Type Definition](../json-type-definition) - check out [Choosing schema language](./schema-language), they have
different advantages and disadvantages.

For example, to validate an object that has a required property "foo" (an integer number), an optional property "bar" (a string) and no other properties:

<code-group>
<code-block title="JSON Schema">
```javascript
const Ajv = require("ajv").default
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

const schema = {
  type: "object",
  properties: {
    foo: {type: "integer"},
    bar: {type: "string"}
  },
  required: ["foo"],
  additionalProperties: false
}

const validate = ajv.compile(schema)

const validData = {
  foo: 1,
  bar: "abc"
}

const valid = validate(data)
if (!valid) console.log(validate.errors)
```
</code-block>

<code-block title="JSON Type Definition">
```javascript
const Ajv = require("ajv/dist/jtd").default
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

const schema = {
  properties: {
    foo: {type: "int32"}
  },
  optionalProperties: {
    bar: {type: "string"}
  }
}


const validate = ajv.compile(schema)

const validData = {
  foo: 1,
  bar: "abc"
}

const valid = validate(data)
if (!valid) console.log(validate.errors)
```
</code-block>
</code-group>

Ajv compiles schemas to functions and caches them in all cases (using schema itself as a key for Map), so that the next time the same schema object is used it won't be compiled again.

::: tip Please note
The best performance is achieved when using compiled functions returned by `compile` or `getSchema` methods.

While execution of the compiled validation function is very fast, its compilation is
relatively slow, so you need to make sure that you compile schemas only once and
re-use compiled validation functions. See [Managing multiple schemas](./managing-schemas).
:::

::: warning Please note
Every time a validation function (or `ajv.validate`) is called `errors` property is overwritten. You need to copy `errors` array reference to another variable if you want to use it later (e.g., in the callback). See [Validation errors](../api.md#validation-errors)
:::

## Parsing and serializing JSON <Badge text="New" />

Ajv can compile efficient parsers and serializers from [JSON Type Definition](../json-type-definition) schemas.

Serializing the data with a function specialized to your data shape can be more than 10x compared with `JSON.stringify`.

Parsing the data replaces the need for a separate validation after generic parsing with `JSON.parse` (although validation itself is usually much faster than parsing). In case your JSON string is valid specialized parsing is as approximately fast as JSON.parse, but in case your JSON is invalid, specialized parsing would fail much faster - so it can be very efficient in some scenarios.

For the same data structure, you can compile parser and serializer in this way:

<code-group>
<code-block title="JSON Type Definition">
```javascript
const Ajv = require("ajv/dist/jtd").default
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

const schema = {
  properties: {
    foo: {type: "int32"}
  },
  optionalProperties: {
    bar: {type: "string"}
  }
}

const serialize = ajv.compileSerializer(schema)
console.log(serialize(data))

const parse = ajv.compileParser(schema)

const data = {
  foo: 1,
  bar: "abc"
}

const json = '{"foo": 1, "bar": "abc"}'
const invalidJson = '{"unknown": "abc"}'

console.log(parseAndLog(json)) // logs {foo: 1, bar: "abc"}
console.log(parseAndLog(invalidJson)) // logs error and position

function parseAndLog(json) {
  const data = parse(json)
  if (data === undefined) {
    console.log(parse.message) // error message from the last parse call
    console.log(parse.position) // error position in string
  } else {
    console.log(data)
  }
}
```
</code-block>
</code-group>

::: tip Please note
You would have smaller performance benefits in case your schema contains some properties or other parts that are empty schemas (`{}`) - parser would call `JSON.parse` in this case.
:::

::: warning Please note
Compiled parsers, unlike JSON.parse, do not throw the exception in case JSON string is not a valid JSON or in case data is invalid according to the schema. As soon as the parser determines that either JSON or data is invalid, it returns `undefined` and reports error and position via parsers properties `message` and `position`.
:::
