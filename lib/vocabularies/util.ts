import {schemaHasRules} from "../compile/util"
import {CompilationContext} from "../types"
import KeywordContext from "../compile/context"
import CodeGen, {_, nil, Code, Name, Expression, getProperty} from "../compile/codegen"
import N from "../compile/names"

export function bad$DataType(
  schemaCode: Code | number | boolean,
  schemaType: string,
  $data?: string | false
): Code {
  return $data ? _`(${schemaCode}!==undefined && typeof ${schemaCode}!==${schemaType})` : nil
}

export function schemaRefOrVal(
  {topSchemaRef, schemaPath}: CompilationContext,
  schema: unknown,
  keyword: string,
  $data?: string | false
): Code | number | boolean {
  // return $data || typeof schema === "object"
  //   ? `${topSchemaRef}${schemaPath + getProperty(keyword)}`
  //   : _`${schema}`
  if (!$data) {
    if (typeof schema == "number" || typeof schema == "boolean") return schema
    if (typeof schema == "string") return _`${schema}`
  }
  return _`${topSchemaRef}${schemaPath}${getProperty(keyword)}`
}

export function alwaysValidSchema(
  {RULES, opts: {strictKeywords}}: CompilationContext,
  schema: boolean | object
): boolean | void {
  return typeof schema == "boolean"
    ? schema === true
    : strictKeywords
    ? Object.keys(schema).length === 0
    : !schemaHasRules(schema, RULES.all)
}

export function allSchemaProperties(schema?: object): string[] {
  return schema ? Object.keys(schema).filter((p) => p !== "__proto__") : []
}

export function schemaProperties(it: CompilationContext, schema: object): string[] {
  return allSchemaProperties(schema).filter((p) => !alwaysValidSchema(it, schema[p]))
}

export function isOwnProperty(data: Name, property: Expression): Code {
  return _`Object.prototype.hasOwnProperty.call(${data}, ${property})`
}

export function propertyInData(data: Name, property: Expression, ownProperties?: boolean): Code {
  const cond = _`${data}${getProperty(property)} !== undefined`
  return ownProperties ? _`${cond} && ${isOwnProperty(data, property)}` : cond
}

export function noPropertyInData(data: Name, property: Expression, ownProperties?: boolean): Code {
  const cond = _`${data}${getProperty(property)} === undefined`
  return ownProperties ? _`${cond} || !${isOwnProperty(data, property)}` : cond
}

export function loopPropertiesCode(
  {gen, data, it}: KeywordContext,
  loopBody: (key: Name) => void
): void {
  // TODO maybe always iterate own properties in v7?
  const key = gen.name("key")
  const iteration = it.opts.ownProperties ? _`of Object.keys(${data})` : _`in ${data}`
  gen.for(_`const ${key} ${iteration}`, () => loopBody(key))
}

export function orExpr(items: string[], condition: (s: string, i: number) => Code): Code {
  return items.map(condition).reduce(orCode)
}

export function or(...args: Code[]): Code {
  return args.reduce(orCode)
}

function orCode(x: Code, y: Code): Code {
  return x === nil ? y : y === nil ? x : _`${x} || ${y}`
}

export function callValidate(
  {schemaCode, data, it}: KeywordContext,
  func: Expression,
  context?: string,
  passSchema?: boolean
): string {
  const dataAndSchema = passSchema
    ? _`${schemaCode}, ${data}, ${it.topSchemaRef}${it.schemaPath}`
    : data
  const dataPath = `(${N.dataPath} || '')${it.errorPath === '""' ? "" : ` + ${it.errorPath}`}` // TODO joinPaths?
  const args = `${dataAndSchema}, ${dataPath}, ${it.parentData}, ${it.parentDataProperty}, ${N.rootData}`
  return context ? `${func}.call(${context}, ${args})` : `${func}(${args})`
}

export function usePattern(gen: CodeGen, pattern: string): Name {
  return gen.value("pattern", {
    key: pattern,
    ref: new RegExp(pattern),
    code: _`new RegExp(${pattern})`,
  })
}
