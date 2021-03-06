# User defined keywords

[[toc]]

## Common attributes of keyword definitions

The usual interface to define all keywords has these properties:

```typescript
interface _KeywordDef {
  keyword: string | string[]
  type?: JSONType | JSONType[] // data type(s) that keyword applies to,
  // if defined, it is usually "string", "number", "object" or "array"
  schemaType?: JSONType | JSONType[] // the allowed type(s) of value that keyword must have in the schema
  error?: {
    message: string | ((cxt: KeywordCxt) => Code)
    params?: (cxt: KeywordCxt) => Code
  }
}
```

Keyword definitions may have additional optional properties - see [types](https://github.com/ajv-validator/ajv/blob/master/lib/types/index.ts) and [KeywordCxt](https://github.com/ajv-validator/ajv/blob/master/lib/compile/context.ts).

### Define keyword with code generation function <Badge text="recommended" />

Starting from v7 Ajv uses [CodeGen module](https://github.com/ajv-validator/ajv/blob/master/lib/compile/codegen/index.ts) for all pre-defined keywords - see [codegen.md](./codegen.md) for details.

This is the best approach for user defined keywords:

- safe against code injection
- best performance
- the precise control over validation process
- access to the parent data and the path to the currently validated data

While Ajv can be safely used with plain JavaScript, it is strongly recommended to use Typescript for user-defined keywords that generate code - the prevention against code injection via untrusted schemas is partially based on the type system, not only on runtime checks.

The usual keyword definition for keywords generating code extends common interface with "code" function:

```typescript
interface CodeKeywordDefinition extends _KeywordDef {
  code: (cxt: KeywordCxt, ruleType?: string) => void // code generation function
}
```

Example `even` keyword:

```typescript
import {_, KeywordCxt} from Ajv

ajv.addKeyword({
  keyword: "even",
  type: "number",
  schemaType: "boolean",
  // $data: true // to support [$data reference](./guide/combining-schemas.md#data-reference), ...
  code(cxt: KeywordCxt) {
    const {data, schema} = cxt
    const op = schema ? _`!==` : _`===`
    cxt.fail(_`${data} %2 ${op} 0`) // ... the only code change needed is to use `cxt.fail$data` here
  },
})

const schema = {even: true}
const validate = ajv.compile(schema)
console.log(validate(2)) // true
console.log(validate(3)) // false
```

Example `range` keyword:

```typescript
import {_, nil, KeywordCxt} from Ajv

ajv.addKeyword({
  keyword: "range",
  type: "number",
  code(cxt: KeywordCxt) {
    const {schema, parentSchema, data} = cxt
    const [min, max] = schema
    const eq: Code = parentSchema.exclusiveRange ? _`=` : nil
    cxt.fail(_`${data} <${eq} ${min} || ${data} >${eq} ${max}`)
  },
  metaSchema: {
    type: "array",
    items: [{type: "number"}, {type: "number"}],
    minItems: 2,
    additionalItems: false,
  },
})
```

You can review pre-defined Ajv keywords in [validation](https://github.com/ajv-validator/ajv/blob/master/lib/validation) folder for more advanced examples - it is much easier to define code generation keywords than it was in the previous version of Ajv.

See [KeywordCxt](https://github.com/ajv-validator/ajv/blob/master/lib/compile/context.ts) and [SchemaCxt](https://github.com/ajv-validator/ajv/blob/master/lib/compile/index.ts) type definitions for more information about properties you can use in your keywords.

### Define keyword with "validate" function

Usual keyword definition for validation keywords:

```typescript
interface FuncKeywordDefinition extends _KeywordDef {
  validate?: SchemaValidateFunction | DataValidateFunction // DataValidateFunction requires `schema: false` option
  schema?: boolean // schema: false makes validate not to expect schema (DataValidateFunction)
  modifying?: boolean
  async?: boolean
  valid?: boolean
  errors?: boolean | "full"
}

interface SchemaValidateFunction {
  (schema: any, data: any, parentSchema?: AnySchemaObject, dataCxt?: DataValidationCxt):
    | boolean
    | Promise<any>
  errors?: Partial<ErrorObject>[]
}

interface DataValidateFunction {
  (this: Ajv | any, data: any, dataCxt?: DataValidationCxt): boolean | Promise<any>
  errors?: Partial<ErrorObject>[]
}
```

The function should return validation result as boolean. It can return an array of validation errors via `.errors` property of itself (otherwise a standard error will be used).

`validate` keywords are suitable for:

- testing your keywords before converting them to compiled/code keywords
- defining keywords that do not depend on the schema value (e.g., when the value is always `true`). In this case you can add option `schema: false` to the keyword definition and the schemas won't be passed to the validation function, it will only receive the same parameters as compiled validation function.
- defining keywords where the schema is a value used in some expression.
- defining keywords that support [\$data reference](./guide/combining-schemas.md#data-reference) - in this case `validate` or `code` function is required, either as the only option or in addition to `compile` or `macro`.

Example: `constant` keyword (a synonym for draft-06 keyword `const`, it is equivalent to `enum` keyword with one item):

```javascript
ajv.addKeyword({
  keyword: "constant",
  validate: (schema, data) =>
    typeof schema == "object" && schema !== null ? deepEqual(schema, data) : schema === data,
  errors: false,
})

const schema = {
  constant: 2,
}
const validate = ajv.compile(schema)
console.log(validate(2)) // true
console.log(validate(3)) // false

const schema = {
  constant: {foo: "bar"},
}
const validate = ajv.compile(schema)
console.log(validate({foo: "bar"})) // true
console.log(validate({foo: "baz"})) // false
```

`const` keyword is already available in Ajv.

::: tip Please note
If the keyword does not define errors (see [Reporting errors](./api.md#reporting-errors)) pass `errors: false` in its definition; it will make generated code more efficient.
:::

To add asynchronous keyword pass `async: true` in its definition.

### Define keyword with "compile" function

The keyword is similar to "validate", with the difference that "compile" property has function that will be called during schema compilation and should return validation function:

```typescript
interface FuncKeywordDefinition extends _KeywordDef {
  compile?: (schema: any, parentSchema: AnySchemaObject, it: SchemaObjCxt) => DataValidateFunction
  schema?: boolean // schema: false makes validate not to expect schema (DataValidateFunction)
  modifying?: boolean
  async?: boolean
  valid?: boolean
  errors?: boolean | "full"
}
```

In some cases it is the best approach to define keywords, but it has the performance cost of an extra function call during validation. If keyword logic can be expressed via some other JSON Schema then `macro` keyword definition is more efficient (see below).

Example. `range` and `exclusiveRange` keywords using compiled schema:

```javascript
ajv.addKeyword({
  keyword: "range",
  type: "number",
  compile([min, max], parentSchema) {
    return parentSchema.exclusiveRange === true
      ? (data) => data > min && data < max
      : (data) => data >= min && data <= max
  },
  errors: false,
  metaSchema: {
    // schema to validate keyword value
    type: "array",
    items: [{type: "number"}, {type: "number"}],
    minItems: 2,
    additionalItems: false,
  },
})

const schema = {
  range: [2, 4],
  exclusiveRange: true,
}
const validate = ajv.compile(schema)
console.log(validate(2.01)) // true
console.log(validate(3.99)) // true
console.log(validate(2)) // false
console.log(validate(4)) // false
```

See note on errors and asynchronous keywords in the previous section.

### Define keyword with "macro" function

Keyword definition:

```typescript
interface MacroKeywordDefinition extends FuncKeywordDefinition {
  macro: (schema: any, parentSchema: AnySchemaObject, it: SchemaCxt) => AnySchema
}
```

"Macro" function is called during schema compilation. It is passed schema, parent schema and [schema compilation context](#schema-compilation-context) and it should return another schema that will be applied to the data in addition to the original schema.

It is an efficient approach (in cases when the keyword logic can be expressed with another JSON Schema), because it is usually easy to implement and there is no extra function call during validation.

In addition to the errors from the expanded schema macro keyword will add its own error in case validation fails.

Example. `range` and `exclusiveRange` keywords from the previous example defined with macro:

```javascript
ajv.addKeyword({
  keyword: "range",
  type: "number",
  macro: ([minimum, maximum]) => ({minimum, maximum}), // schema with keywords minimum and maximum
  // metaSchema: the same as in the example above
})
```

Macro keywords an be recursive - i.e. return schemas containing the same keyword. See the example of defining a recursive macro keyword `deepProperties` in the [test](../spec/keyword.spec.ts#L316).

## Schema compilation context

Schema compilation context [SchemaCxt](https://github.com/ajv-validator/ajv/blob/master/lib/compile/index.ts) is available in property `it` of [KeywordCxt](https://github.com/ajv-validator/ajv/blob/master/lib/compile/context.ts) (and it is also the 3rd parameter of `compile` and `macro` keyword functions). See types in the source code on the properties you can use in this object.

## Validation time variables

All function scoped variables available during validation are defined in [names](https://github.com/ajv-validator/ajv/blob/master/lib/compile/names.ts).

## Reporting errors

All keywords can define error messages with `KeywordErrorDefinition` object passed as `error` property of keyword definition:

```typescript
interface KeywordErrorDefinition {
  message: string | ((cxt: KeywordErrorCxt) => Code)
  params?: (cxt: KeywordErrorCxt) => Code
}
```

`code` keywords can pass parameters to these functions via `cxt.setParams` (see implementations of pre-defined keywords), other keywords can only set a string message this way.

Another approach for reporting errors can be used for `validate` and `compile` keyword - they can define errors by assigning them to `.errors` property of the validation function. Asynchronous keywords can return promise that rejects with `new Ajv.ValidationError(errors)`, where `errors` is an array of validation errors (if you don't want to create errors in asynchronous keyword, its validation function can return the promise that resolves with `false`).

Each error object in `errors` array should at least have properties `keyword`, `message` and `params`, other properties will be added.

If keyword doesn't define or return errors, the default error will be created in case the keyword fails validation.
