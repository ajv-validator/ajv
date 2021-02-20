import type Ajv from "../core"
import type {SchemaObject} from "../types"
import {SchemaEnv, getCompilingSchema} from "."
import {_, str, and, getProperty, stringify, CodeGen, Code, Name} from "./codegen"
import {_Code} from "./codegen/code"
import {MissingRefError} from "./error_classes"
import N from "./names"
import {isOwnProperty} from "../vocabularies/code"
import {hasRef} from "../vocabularies/jtd/ref"

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

interface SerializeCxt {
  readonly gen: CodeGen
  readonly self: Ajv // current Ajv instance
  readonly schemaEnv: SchemaEnv
  readonly definitions: SchemaObjectMap
  readonly jsonStr: Name
  schema: SchemaObject
  data: Code
}

export function compileSerializer(
  this: Ajv,
  sch: SchemaEnv,
  definitions: SchemaObjectMap
): SchemaEnv {
  const _sch = getCompilingSchema.call(this, sch)
  if (_sch) return _sch
  const {es5, lines} = this.opts.code
  const {ownProperties} = this.opts
  const gen = new CodeGen(this.scope, {es5, lines, ownProperties})
  const serializeName = gen.scopeName("serialize")
  const jsonStr = gen.name("json")
  const cxt = {
    self: this,
    gen,
    schema: sch.schema as SchemaObject,
    schemaEnv: sch,
    definitions,
    jsonStr,
    data: N.data,
  }

  let sourceCode: string | undefined
  try {
    this._compilations.add(sch)
    sch.serializeName = serializeName
    gen.func(serializeName, N.data, false, () => {
      gen.let(jsonStr, str``)
      serializeCode(cxt)
      gen.return(jsonStr)
    })
    gen.optimize(this.opts.code.optimize)
    const serializeFuncCode = gen.toString()
    sourceCode = `${gen.scopeRefs(N.scope)}return ${serializeFuncCode}`
    const makeSerialize = new Function(`${N.scope}`, sourceCode)
    const serialize: (data: unknown) => string = makeSerialize(this.scope.get())
    this.scope.value(serializeName, {ref: serialize})
    sch.serialize = serialize
  } catch (e) {
    if (sourceCode) this.logger.error("Error compiling serializer, function code:", sourceCode)
    delete sch.serialize
    delete sch.serializeName
    throw e
  } finally {
    this._compilations.delete(sch)
  }
  return sch
}

function serializeCode(cxt: SerializeCxt): void {
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
  const {gen, schema, jsonStr, data} = cxt
  if (!schema.nullable) return serializeForm(cxt)
  gen.if(
    _`${data} === undefined || ${data} === null`,
    () => gen.add(jsonStr, _`"null"`),
    () => serializeForm(cxt)
  )
}

function serializeElements(cxt: SerializeCxt): void {
  const {gen, schema, jsonStr, data} = cxt
  gen.add(jsonStr, str`[`)
  const first = gen.let("first", true)
  gen.forOf("el", data, (el) => {
    addComma(cxt, first)
    serializeCode({...cxt, schema: schema.elements, data: el})
  })
  gen.add(jsonStr, str`]`)
}

function serializeValues(cxt: SerializeCxt): void {
  const {gen, schema, jsonStr, data} = cxt
  gen.add(jsonStr, str`{`)
  const first = gen.let("first", true)
  gen.forIn("key", data, (key) => {
    addComma(cxt, first)
    serializeString({...cxt, data: key})
    gen.add(jsonStr, str`:`)
    const value = gen.const("value", _`${data}${getProperty(key)}`)
    serializeCode({...cxt, schema: schema.values, data: value})
  })
  gen.add(jsonStr, str`}`)
}

function serializeDiscriminator(cxt: SerializeCxt): void {
  const {gen, schema, jsonStr, data} = cxt
  const {discriminator} = schema
  gen.add(jsonStr, str`{${JSON.stringify(discriminator)}:`)
  const tag = gen.const("tag", _`${data}${getProperty(discriminator)}`)
  serializeString({...cxt, data: tag})
  const first = gen.let("first", false)
  gen.if(false)
  for (const tagValue in schema.mapping) {
    gen.elseIf(_`${tag} === ${tagValue}`)
    serializeSchemaProperties({...cxt, schema: schema.mapping[tagValue]}, first)
  }
  gen.endIf()
  gen.add(jsonStr, str`}`)
}

function serializeProperties(cxt: SerializeCxt): void {
  const {gen, jsonStr} = cxt
  gen.add(jsonStr, str`{`)
  const first = gen.let("first", true)
  serializeSchemaProperties(cxt, first)
  gen.add(jsonStr, str`}`)
}

function serializeSchemaProperties(cxt: SerializeCxt, first: Name): void {
  const {gen, schema, jsonStr, data} = cxt
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
    addComma(cxt, first)
    gen.add(jsonStr, str`${JSON.stringify(key)}:`)
    serializeCode({...cxt, data: value})
  }
}

function serializeType(cxt: SerializeCxt): void {
  const {gen, schema, jsonStr, data} = cxt
  switch (schema.type) {
    case "boolean":
      gen.add(jsonStr, _`${data} ? "true" : "false"`)
      break
    case "string":
      serializeString(cxt)
      break
    case "timestamp":
      gen.if(
        _`${data} instanceof Date`,
        () => gen.add(jsonStr, _`${data}.toISOString()`),
        () => serializeString(cxt)
      )
      break
    default:
      serializeNumber(cxt)
  }
}

function serializeString({gen, jsonStr, data}: SerializeCxt): void {
  gen.add(jsonStr, _`${quoteFunc(gen)}(${data})`)
}

function serializeNumber({gen, jsonStr, data}: SerializeCxt): void {
  gen.add(jsonStr, _`"" + ${data}`)
}

function serializeRef(cxt: SerializeCxt): void {
  const {gen, self, jsonStr, data, definitions, schema, schemaEnv} = cxt
  const {ref} = schema
  const refSchema = definitions[ref]
  if (!refSchema) throw new MissingRefError("", ref, `No definition ${ref}`)
  if (!hasRef(refSchema)) return serializeCode({...cxt, schema: refSchema})
  const {root} = schemaEnv
  const sch = compileSerializer.call(self, new SchemaEnv({schema: refSchema, root}), definitions)
  gen.add(jsonStr, _`${getSerialize(gen, sch)}(${data})`)
}

function getSerialize(gen: CodeGen, sch: SchemaEnv): Code {
  return sch.serialize
    ? gen.scopeValue("serialize", {ref: sch.serialize})
    : _`${gen.scopeValue("wrapper", {ref: sch})}.serialize`
}

function serializeEmpty({gen, jsonStr, data}: SerializeCxt): void {
  gen.add(jsonStr, _`JSON.stringify(${data})`)
}

function addComma({gen, jsonStr}: SerializeCxt, first: Name): void {
  gen.if(
    first,
    () => gen.assign(first, false),
    () => gen.add(jsonStr, str`,`)
  )
}

// eslint-disable-next-line no-control-regex, no-misleading-character-class
const rxEscapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g

const rxEscapableRx = /rxEscapable/g

const escaped: {[K in string]?: string} = {
  "\b": "\\b",
  "\t": "\\t",
  "\n": "\\n",
  "\f": "\\f",
  "\r": "\\r",
  '"': '\\"',
  "\\": "\\\\",
}

const escapedRx = /escapedRx/g

function quote(s: string): string {
  rxEscapable.lastIndex = 0
  return (
    '"' +
    (rxEscapable.test(s)
      ? s.replace(rxEscapable, (a) => {
          const c = escaped[a]
          return typeof c === "string"
            ? c
            : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
        })
      : s) +
    '"'
  )
}

function quoteFunc(gen: CodeGen): Name {
  // const quoteName = gen.getScopeValue("func", quote)
  // if (quoteName) return quoteName
  const escapedName = gen.scopeValue("obj", {
    ref: escaped,
    code: stringify(escaped),
  })
  const rxEscapableName = gen.scopeValue("obj", {
    ref: rxEscapable,
    code: new _Code(rxEscapable.toString()),
  })
  return gen.scopeValue("func", {
    ref: quote,
    code: new _Code(
      quote
        .toString()
        .replace(rxEscapableRx, rxEscapableName.toString())
        .replace(escapedRx, escapedName.toString())
    ),
  })
}
