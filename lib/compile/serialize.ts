import type Ajv from "../core"
import type {SchemaObject} from "../types"
import {_, str, and, getProperty, CodeGen, Code, Name} from "./codegen"
import N from "./names"
import {isOwnProperty} from "../vocabularies/code"

type SchemaObjectMap = {[Ref in string]?: SchemaObject}

const jtdForms = [
  "elements",
  "values",
  "discriminator",
  "properties",
  "optionalProperties",
  "enum",
  "type",
  "ref",
] as const

type JTDForm = typeof jtdForms[number]

const genSerialize: {[S in JTDForm]: (cxt: SerializeCxt) => void} = {
  elements: serializeElements,
  values: serializeValues,
  discriminator: serializeDiscriminator,
  properties: serializeProperties,
  optionalProperties: serializeProperties,
  enum: serializeString,
  type: serializeType,
  ref: serializeRef,
}

export type SerializeFunction<T = unknown> = (data: T) => string

interface SerializeCxt {
  gen: CodeGen
  schema: SchemaObject
  definitions: SchemaObjectMap
  data: Code
  result: Name
}

export function compileSerializer(
  this: Ajv,
  schema: SchemaObject,
  definitions: SchemaObjectMap
): SerializeFunction {
  const {es5, lines} = this.opts.code
  const {ownProperties} = this.opts
  const gen = new CodeGen(this.scope, {es5, lines, ownProperties})
  const serializeName = gen.scopeName("serialize")
  gen.func(serializeName, N.data, false, () => {
    const result = gen.let("result", str``)
    const cxt = {gen, schema, definitions, result, data: N.data}
    genSerializeCode(cxt)
  })
  gen.optimize(this.opts.code.optimize)
  const serializeCode = gen.toString()
  const sourceCode = `${gen.scopeRefs(N.scope)}return ${serializeCode}`
  const makeSerialize = new Function(`${N.scope}`, sourceCode)
  const serialize: SerializeFunction = makeSerialize(this.scope.get())
  this.scope.value(serializeName, {ref: serialize})
  return serialize
}

function genSerializeCode(cxt: SerializeCxt): void {
  let form: JTDForm | undefined
  for (const key of jtdForms) {
    if (key in cxt.schema) {
      form = key
      break
    }
  }
  serializeNullable(cxt, form ? genSerialize[form] : serializeEmpty)
}

function serializeNullable(cxt: SerializeCxt, serializeForm: (_cxt: SerializeCxt) => void): void {
  const {gen, schema, result, data} = cxt
  if (!schema.nullable) return serializeForm(cxt)
  gen.if(
    _`${data} === undefined || ${data} === null`,
    () => gen.add(result, _`null`),
    () => serializeForm(cxt)
  )
}

function serializeElements(cxt: SerializeCxt): void {
  const {gen, schema, result, data} = cxt
  gen.add(result, str`[`)
  let first = true
  gen.forOf("element", data, (el) => {
    if (!first) gen.add(result, str`,`)
    first = false
    genSerializeCode({...cxt, schema: schema.elements, data: el})
  })
  gen.add(result, str`]`)
}

function serializeValues(cxt: SerializeCxt): void {
  const {gen, schema, result, data} = cxt
  gen.add(result, str`{`)
  let first = true
  gen.forIn("key", data, (key) => {
    if (!first) gen.add(result, str`,`)
    first = false
    serializeString({...cxt, data: key})
    gen.add(result, str`:`)
    const value = gen.const("value", _`${data}${getProperty(key)}`)
    genSerializeCode({...cxt, schema: schema.values, data: value})
  })
  gen.add(result, str`}`)
}

function serializeDiscriminator(cxt: SerializeCxt): void {
  const {gen, schema, result, data} = cxt
  const {discriminator} = schema
  gen.add(result, str`{${JSON.stringify(discriminator)}:`)
  const tag = gen.const("tag", _`${data}${getProperty(discriminator)}`)
  serializeString({...cxt, data: tag})
  gen.if(false)
  for (const tagValue in schema.mapping) {
    gen.elseIf(_`${tag} === ${tagValue}`)
    serializeSchemaProperties({...cxt, schema: schema.mapping[tagValue]}, false)
  }
  gen.endIf()
  gen.add(result, str`}`)
}

function serializeProperties(cxt: SerializeCxt): void {
  const {gen, result} = cxt
  gen.add(result, str`{`)
  serializeSchemaProperties(cxt, true)
  gen.add(result, str`}`)
}

function serializeSchemaProperties(cxt: SerializeCxt, first: boolean): void {
  const {gen, schema, result, data} = cxt
  const {properties, optionalProperties} = schema
  for (const key in properties || {}) {
    serializeProperty(key, keyValue(key))
  }
  for (const key in optionalProperties || {}) {
    const value = keyValue(key)
    gen.if(and(_`${value} !== undefined`, isOwnProperty(gen, data, key)), () =>
      serializeProperty(key, value)
    )
  }

  function keyValue(key: string): Name {
    return gen.const("value", _`${data}${getProperty(key)}`)
  }

  function serializeProperty(key: string, value: Name): void {
    if (!first) gen.add(result, str`,`)
    first = false
    gen.add(result, str`${JSON.stringify(key)}:`)
    genSerializeCode({...cxt, data: value})
  }
}

function serializeType(cxt: SerializeCxt): void {
  const {gen, schema, result, data} = cxt
    switch (schema.type) {
      case "boolean":
        gen.add(result, _`${data} ? "true" : "false`)
        break
      case "string":
        serializeString(cxt)
        break
      case "timestamp":
        gen.if(_`${data} instanceof Date`,
          () => gen.add(result, _`${data}.toISOString()`),
          () => serializeString(cxt)
        )
        break
      default:
        serializeNumber(cxt)
    }
}

function serializeString(_cxt: SerializeCxt): void {}

function serializeNumber({gen, result, data}: SerializeCxt): void {
  gen.add(result, _`"" + ${data}`)
}

function serializeRef(_cxt: SerializeCxt): void {}

function serializeEmpty(_cxt: SerializeCxt): void {}
