# Strict mode

Strict mode intends to prevent any unexpected behaviours or silently ignored mistakes in user schemas. It does not change any validation results compared with the specification, but it makes some schemas invalid and throws exception or logs warning (with `strict: "log"` option) in case any restriction is violated.

To disable all strict mode restrictions use option `strict: false`. Some of the restrictions can be changed with their own options

[[toc]]

## JSON Type Definition schemas

JTD specification is strict - whether Ajv strict mode is enabled or not it will not allow schemas with ignored or ambiguous elements, including:

- unknown schema keywords
- combining multiple schema forms in one schema
- defining the same property as both required and optional
- re-defining discriminator tag inside properties, even if the definition is non-contradictory

See [JSON Type Definition](./json-type-definition.md) for informal and [RFC8927](https://datatracker.ietf.org/doc/rfc8927/) for formal specification descriptions.

The only change that strict mode introduces to JTD schemas, without changing their syntax or semantics, is the requirement that all members that are present in optional `metadata` members are defined as Ajv keywords. This restriction can be disabled with `strict: false` option, without any impact to other JTD features.

## JSON Schema schemas

JSON Schema specification is very permissive and allows many elements in the schema to be quietly ignored or be ambiguous. It is recommended to use JSON Schema with strict mode.

Option `strict` with value `true`/`false`/`"log"` can be used to set all strict mode restriction to be the same, otherwise individual strict mode options can be used. See [Strict mode options](./options.md#strict-mode-options).

### Prohibit ignored keywords <Badge text="strictSchema option" />

#### Unknown keywords

JSON Schema [section 6.5](https://tools.ietf.org/html/draft-handrews-json-schema-02#section-6.5) requires to ignore unknown keywords. The motivation is to increase cross-platform portability of schemas, so that implementations that do not support certain keywords can still do partial validation.

The problems with this approach are:

- Different validation results with the same schema and data, leading to bugs and inconsistent behaviours.
- Typos in keywords resulting in keywords being quietly ignored, requiring extensive test coverage of schemas to avoid these mistakes.

By default Ajv fails schema compilation when unknown keywords are used. Users can explicitly define the keywords that should be allowed and ignored:

```javascript
ajv.addKeyword("allowedKeyword")
```

or use the convenience method `addVocabulary` for multiple keywords

```javascript
ajv.addVocabulary(["allowed1", "allowed2"]) // simply calls addKeyword multiple times
```

#### Ignored "additionalItems" keyword

JSON Schema section [9.3.1.2](https://tools.ietf.org/html/draft-handrews-json-schema-02#section-9.3.1.2) requires to ignore "additionalItems" keyword if "items" keyword is absent or if it is not an array of items. This is inconsistent with the interaction of "additionalProperties" and "properties", and may cause unexpected results.

By default Ajv fails schema compilation when "additionalItems" is used without "items" (or if "items" is not an array).

#### Ignored "if", "then", "else" keywords

JSON Schema section [9.2.2](https://tools.ietf.org/html/draft-handrews-json-schema-02#section-9.2.2) requires to ignore "if" (only annotations are collected) if both "then" and "else" are absent, and ignore "then"/"else" if "if" is absent.

By default Ajv fails schema compilation in these cases.

#### Ignored "contains", "maxContains" and "minContains" keywords

JSON Schema sections [6.4.4, 6.4.5](https://json-schema.org/draft/2019-09/json-schema-validation.html#rfc.section.6.4.4) require to ignore keywords "maxContains" and "minContains" if "contains" keyword is absent.

It is also implied that when "minContains" is 0 and "maxContains" is absent, "contains" keyword is always valid.

By default Ajv fails schema compilation in these cases.

#### Unknown formats

By default unknown formats throw exception during schema compilation (and fail validation in case format keyword value is [\$data reference](./guide/combining-schemas.md#data-reference)). It is possible to opt out of format validation completely with options `validateFormats: false`. You can define all known formats with `addFormat` method or `formats` option - to have some format ignored pass `true` as its definition:

```javascript
const ajv = new Ajv({formats: {
  reserved: true
})
```

Standard JSON Schema formats are provided in [ajv-formats](https://github.com/ajv-validator/ajv-formats) package - see [Formats](./guide/formats) section.

#### Ignored defaults

With `useDefaults` option Ajv modifies validated data by assigning defaults from the schema, but there are different limitations when the defaults can be ignored (see [Assigning defaults](./guide/modifying-data.md#assigning-defaults)). In strict mode Ajv fails schema compilation if such defaults are used in the schema.

### Prevent unexpected validation

#### Overlap between "properties" and "patternProperties" keywords <Badge text="allowMatchingProperties option"/>

The expectation of users (see #196, #286) is that "patternProperties" only apply to properties not already defined in "properties" keyword, but JSON Schema section [9.3.2](https://tools.ietf.org/html/draft-handrews-json-schema-02#section-9.3.2) defines these two keywords as independent. It means that to some properties two subschemas can be applied - one defined in "properties" keyword and another defined in "patternProperties" for the pattern matching this property.

By default Ajv fails schema compilation if a pattern in "patternProperties" matches a property in "properties" in the same schema.

In addition to allowing such patterns by using option `strict: false` or `strictSchema: false`, there is an option `allowMatchingProperties: true` to only allow this case without disabling other strict mode restrictions - there are some rare cases when this is necessary.

To reiterate, neither this nor other strict mode restrictions change the validation results - they only restrict which schemas are valid.

#### Defined required properties <Badge text="strictRequired option" />

With option `strictRequired` set to `"log"` or `true` Ajv logs warning or throws exception if the property used in "required" keyword is not defined in "properties" keyword in the same or some parent schema relating to the same object (data instance).

By default this option is disabled.

::: warning Property defined in parent schema
There are cases when property defined in the parent schema will not be taken into account.
:::

#### Unconstrained tuples <Badge text="strictTuples option" />

Ajv also logs a warning if "items" is an array (for schema that defines a tuple) but neither "minItems" nor "additionalItems"/"maxItems" keyword is present (or have a wrong value):

```javascript
{
  type: "array",
  items: [{type: "number"}, {type: "boolean"}]
}
```

The above schema may have a mistake, as tuples usually are expected to have a fixed size. To "fix" it:

```javascript
{
  type: "array",
  items: [{type: "number"}, {type: "boolean"}],
  minItems: 2,
  additionalItems: false
  // or
  // maxItems: 2
}
```

Sometimes users accidentally create schema for unit (a tuple with one item) that only validates the first item, this restriction prevents this mistake as well.

Use `strictTuples` option to suppress this warning (`false`) or turn it into exception (`true`).

If you use `JSONSchemaType<T>` this mistake will also be prevented on a type level.

### Strict types <Badge text="strictTypes option" />

An additional option `strictTypes` ("log" by default) imposes additional restrictions on how type keyword is used:

#### Union types <Badge text="allowUnionTypes option" />

With `strictTypes` option "type" keywords with multiple types (other than with "null") are prohibited.

Invalid:

```javascript
{
  type: ["string", "number"]
}
```

Valid:

```javascript
{
  type: ["object", "null"]
}
```

and

```javascript
{
  type: "object",
  nullable: true
}
```

Unions can still be defined with `anyOf` keyword.

The motivation for this restriction is that "type" is usually not the only keyword in the schema, and mixing other keywords that apply to different types is confusing. It is also consistent with wider range of versions of OpenAPI specification and has better tooling support. E.g., this example violating `strictTypes`:

```javascript
{
  type: ["number", "array"],
  minimum: 0,
  items: {
    type: "number",
    minimum: 0
  }
}
```

is equivalent to this complying example, that is more verbose but also easier to maintain:

```javascript
{
  anyOf: [
    {
      type: "number",
      minimum: 0,
    },
    {
      type: "array",
      items: {
        type: "number",
        minimum: 0,
      },
    },
  ]
}
```

It also can be refactored:

```javascript
{
  $defs: {
    item: {
      type: "number",
      minimum: 0
    }
  },
  anyOf: [
    {$ref: "#/$defs/item"},
    {
      type: "array",
      items: {$ref: "#/$defs/item"}
    },
  ]
}
```

This restriction can be lifted separately from other `strictTypes` restrictions with `allowUnionTypes: true` option.

#### Contradictory types

Subschemas can apply to the same data instance, and it is possible to have contradictory type keywords - it usually indicate some mistake. For example:

```javascript
{
  type: "object",
  anyOf: [
    {type: "array"},
    {type: "object"}
  ]
}
```

The schema above violates `strictTypes` as "array" type is not compatible with object. If you used `allowUnionTypes: true` option, the above schema can be fixed in this way:

```javascript
{
  type: ["array", "object"],
  anyOf: [
    {type: "array"},
    {type: "object"}
  ]
}
```

::: tip "number" vs "integer"
Type "number" can be narrowed to "integer", the opposite would violate `strictTypes`.
:::

#### Require applicable types

This simple JSON Schema is valid, but it violates `strictTypes`:

```javascript
{
  properties: {
    foo: {type: "number"},
    bar: {type: "string"}
  }
  required: ["foo", "bar"]
}
```

This is a very common mistake that even people experienced with JSON Schema often make - the problem here is that any value that is not an object would be valid against this schema - this is rarely intentional.

To fix it, "type" keyword has to be added:

```javascript
{
  type: "object",
  properties: {
    foo: {type: "number"},
    bar: {type: "string"}
  },
  required: ["foo", "bar"]
}
```

You do not necessarily have to have "type" keyword in the same schema object; as long as there is "type" keyword applying to the same part of data instance in the same schema document, not via "\$ref", it will be ok:

```javascript
{
  type: "object",
  anyOf: [
    {
      properties: {foo: {type: "number"}}
      required: ["foo"]
    },
    {
      properties: {bar: {type: "string"}}
      required: ["bar"]
    }
  ]
}
```

Both "properties" and "required" need `type: "object"` to satisfy `strictTypes` - it is sufficient to have it once in the parent schema, without repeating it in each schema.

### Strict number validation <Badge text="strictNumbers option" />

Strict mode also affects number validation. By default Ajv fails `{"type": "number"}` (or `"integer"`) validation for `Infinity` and `NaN`.
