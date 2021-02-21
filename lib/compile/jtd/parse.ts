import type Ajv from "../../core"
import type {SchemaObject} from "../../types"
import {jtdForms, JTDForm, SchemaObjectMap} from "./types"
import {SchemaEnv, getCompilingSchema} from ".."
import {_, str, and, getProperty, CodeGen, Code, Name} from "../codegen"
import {_Code} from "../codegen/code"
import {MissingRefError} from "../error_classes"
import N from "../names"
import {isOwnProperty} from "../../vocabularies/code"
import {hasRef} from "../../vocabularies/jtd/ref"
import jsonParse from "../../runtime/jsonParse"

type GenParse = (cxt: ParseCxt) => void

const genParse: {[F in JTDForm]: GenParse} = {
  elements: parseElements,
  values: parseValues,
  discriminator: parseDiscriminator,
  properties: parseProperties,
  optionalProperties: parseProperties,
  enum: parseString,
  type: parseType,
  ref: parseRef,
}

interface ParseCxt {
  readonly gen: CodeGen
  readonly self: Ajv // current Ajv instance
  readonly schemaEnv: SchemaEnv
  readonly definitions: SchemaObjectMap
  schema: SchemaObject
  data: Code
  jsonPos: Name | number
}

export default function compileParser(
  this: Ajv,
  sch: SchemaEnv,
  definitions: SchemaObjectMap
): SchemaEnv {
  const _sch = getCompilingSchema.call(this, sch)
  if (_sch) return _sch
  const {es5, lines} = this.opts.code
  const {ownProperties} = this.opts
  const gen = new CodeGen(this.scope, {es5, lines, ownProperties})
  const parseName = gen.scopeName("parse")
  const cxt: ParseCxt = {
    self: this,
    gen,
    schema: sch.schema as SchemaObject,
    schemaEnv: sch,
    definitions,
    data: N.data,
    jsonPos: 0,
  }

  let sourceCode: string | undefined
  try {
    this._compilations.add(sch)
    sch.parseName = parseName
    gen.func(parseName, N.json, false, () => {
      gen.let(N.data)
      gen.let(N.jsonPos)
      parseCode(cxt)
      gen.if(
        _`${N.jsonPos} === ${N.json}.length`,
        () => gen.return(N.data),
        () => throwSyntaxError(gen)
        // gen.throw(
        //   _`new SyntaxError("Unexpected token " + ${N.json}[${N.jsonPos}] + " in JSON at position " + ${N.jsonPos})`
        // )
      )
    })
    gen.optimize(this.opts.code.optimize)
    const parseFuncCode = gen.toString()
    sourceCode = `${gen.scopeRefs(N.scope)}return ${parseFuncCode}`
    const makeParse = new Function(`${N.scope}`, sourceCode)
    const parse: (json: string) => unknown = makeParse(this.scope.get())
    this.scope.value(parseName, {ref: parse})
    sch.parse = parse
  } catch (e) {
    if (sourceCode) this.logger.error("Error compiling parser, function code:", sourceCode)
    delete sch.parse
    delete sch.parseName
    throw e
  } finally {
    this._compilations.delete(sch)
  }
  return sch
}

function parseCode(cxt: ParseCxt): void {
  let form: JTDForm | undefined
  for (const key of jtdForms) {
    if (key in cxt.schema) {
      form = key
      break
    }
  }
  parseNullable(cxt, form ? genParse[form] : parseEmpty)
}

function parseNullable(cxt: ParseCxt, parseForm: GenParse): void {
  const {gen, schema, data} = cxt
  if (!schema.nullable) return parseForm(cxt)
  tryParse(cxt, "null", () => gen.assign(data, null), parseForm)
}

function tryParse(cxt: ParseCxt, s: string, success: GenParse, fail: GenParse): void {
  const {gen, jsonPos} = cxt
  const slice =
    s.length === 1 ? _`${N.json}[${jsonPos}]` : _`${N.json}.slice(${jsonPos}, ${s.length})`
  gen.if(
    _`${slice} === ${s}`,
    () => {
      addJsonPos()
      success(cxt)
    },
    () => fail(cxt)
  )

  function addJsonPos(): void {
    if (jsonPos instanceof Name) {
      gen.add(jsonPos, s.length)
    } else {
      gen.assign(N.jsonPos, jsonPos + s.length)
      cxt.jsonPos = N.jsonPos
    }
  }
}

function parseElements(cxt: ParseCxt): void {
  const {gen, schema, data} = cxt
  gen.add(N.json, str`[`)
  const first = gen.let("first", true)
  gen.forOf("el", data, (el) => {
    addComma(cxt, first)
    parseCode({...cxt, schema: schema.elements, data: el})
  })
  gen.add(N.json, str`]`)
}

function parseValues(cxt: ParseCxt): void {
  const {gen, schema, data} = cxt
  gen.add(N.json, str`{`)
  const first = gen.let("first", true)
  gen.forIn("key", data, (key) => parseKeyValue(cxt, key, schema.values, first))
  gen.add(N.json, str`}`)
}

function parseKeyValue(cxt: ParseCxt, key: Name, schema: SchemaObject, first: Name): void {
  const {gen, data} = cxt
  addComma(cxt, first)
  parseString({...cxt, data: key})
  gen.add(N.json, str`:`)
  const value = gen.const("value", _`${data}${getProperty(key)}`)
  parseCode({...cxt, schema, data: value})
}

function parseDiscriminator(cxt: ParseCxt): void {
  const {gen, schema, data} = cxt
  const {discriminator} = schema
  gen.add(N.json, str`{${JSON.stringify(discriminator)}:`)
  const tag = gen.const("tag", _`${data}${getProperty(discriminator)}`)
  parseString({...cxt, data: tag})
  gen.if(false)
  for (const tagValue in schema.mapping) {
    gen.elseIf(_`${tag} === ${tagValue}`)
    const sch = schema.mapping[tagValue]
    parseSchemaProperties({...cxt, schema: sch}, discriminator)
  }
  gen.endIf()
  gen.add(N.json, str`}`)
}

function parseProperties(cxt: ParseCxt): void {
  const {gen} = cxt
  gen.add(N.json, str`{`)
  parseSchemaProperties(cxt)
  gen.add(N.json, str`}`)
}

function parseSchemaProperties(cxt: ParseCxt, discriminator?: string): void {
  const {gen, schema, data} = cxt
  const {properties, optionalProperties} = schema
  const props = keys(properties)
  const optProps = keys(optionalProperties)
  const allProps = allProperties(props.concat(optProps))
  let first = !discriminator
  for (const key of props) {
    parseProperty(key, properties[key], keyValue(key))
  }
  for (const key of optProps) {
    const value = keyValue(key)
    gen.if(and(_`${value} !== undefined`, isOwnProperty(gen, data, key)), () =>
      parseProperty(key, optionalProperties[key], value)
    )
  }
  if (schema.additionalProperties) {
    gen.forIn("key", data, (key) =>
      gen.if(isAdditional(key, allProps), () =>
        parseKeyValue(cxt, key, {}, gen.let("first", first))
      )
    )
  }

  function keys(ps?: SchemaObjectMap): string[] {
    return ps ? Object.keys(ps) : []
  }

  function allProperties(ps: string[]): string[] {
    if (discriminator) ps.push(discriminator)
    if (new Set(ps).size !== ps.length) {
      throw new Error("JTD: properties/optionalProperties/disciminator overlap")
    }
    return ps
  }

  function keyValue(key: string): Name {
    return gen.const("value", _`${data}${getProperty(key)}`)
  }

  function parseProperty(key: string, propSchema: SchemaObject, value: Name): void {
    if (first) first = false
    else gen.add(N.json, str`,`)
    gen.add(N.json, str`${JSON.stringify(key)}:`)
    parseCode({...cxt, schema: propSchema, data: value})
  }

  function isAdditional(key: Name, ps: string[]): Code | true {
    return ps.length ? and(...ps.map((p) => _`${key} !== ${p}`)) : true
  }
}

function parseType(cxt: ParseCxt): void {
  const {gen, schema, data} = cxt
  switch (schema.type) {
    case "boolean":
      gen.add(N.json, _`${data} ? "true" : "false"`)
      break
    case "string":
      parseString(cxt)
      break
    case "timestamp":
      gen.if(
        _`${data} instanceof Date`,
        () => gen.add(N.json, _`${data}.toISOString()`),
        () => parseString(cxt)
      )
      break
    default:
      parseNumber(cxt)
  }
}

function parseString({gen, data}: ParseCxt): void {
  gen.add(N.json, _`${jsonParseFunc(gen)}(${data})`)
}

function parseNumber({gen, data}: ParseCxt): void {
  gen.add(N.json, _`"" + ${data}`)
}

function parseRef(cxt: ParseCxt): void {
  const {gen, self, data, definitions, schema, schemaEnv} = cxt
  const {ref} = schema
  const refSchema = definitions[ref]
  if (!refSchema) throw new MissingRefError("", ref, `No definition ${ref}`)
  if (!hasRef(refSchema)) return parseCode({...cxt, schema: refSchema})
  const {root} = schemaEnv
  const sch = compileParser.call(self, new SchemaEnv({schema: refSchema, root}), definitions)
  gen.add(N.json, _`${getParse(gen, sch)}(${data})`)
}

function getParse(gen: CodeGen, sch: SchemaEnv): Code {
  return sch.parse
    ? gen.scopeValue("parse", {ref: sch.parse})
    : _`${gen.scopeValue("wrapper", {ref: sch})}.parse`
}

function parseEmpty(cxt: ParseCxt): void {
  const {gen, data, jsonPos} = cxt
  gen.assign(_`[${data}, ${N.jsonPos}]`, _`${jsonParseFunc(gen)}(${N.json}, ${jsonPos})`)
  cxt.jsonPos = N.jsonPos
}

function addComma({gen}: ParseCxt, first: Name): void {
  gen.if(
    first,
    () => gen.assign(first, false),
    () => gen.add(N.json, str`,`)
  )
}

function jsonParseFunc(gen: CodeGen): Name {
  return gen.scopeValue("func", {
    ref: jsonParse,
    code: _`require("ajv/dist/runtime/jsonParse").default`,
  })
}

function syntaxError(json: string, jsonPos: number): void {
  throw new SyntaxError(`Unexpected token ${json[jsonPos]} in JSON at position ${jsonPos}`)
}

const syntaxErrorCode = new _Code(syntaxError.toString())

function throwSyntaxError(gen: CodeGen): void {
  const throwError = gen.scopeValue("func", {
    ref: syntaxError,
    code: syntaxErrorCode,
  })
  gen.code(_`${throwError}(${N.json}, ${N.jsonPos})`)
}
