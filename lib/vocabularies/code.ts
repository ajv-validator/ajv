import type {AnySchema, SchemaMap} from "../types"
import type {SchemaCxt} from "../compile"
import type KeywordCxt from "../compile/context"
import {CodeGen, _, or, nil, strConcat, getProperty, Code, Name} from "../compile/codegen"
import {alwaysValidSchema} from "../compile/util"
import N from "../compile/names"

export function checkReportMissingProp(cxt: KeywordCxt, prop: string): void {
  const {gen, data, it} = cxt
  gen.if(noPropertyInData(data, prop, it.opts.ownProperties), () => {
    cxt.setParams({missingProperty: _`${prop}`}, true)
    cxt.error()
  })
}

export function checkMissingProp(
  {data, it: {opts}}: KeywordCxt,
  properties: string[],
  missing: Name
): Code {
  return or(
    ...properties.map(
      (prop) => _`${noPropertyInData(data, prop, opts.ownProperties)} && (${missing} = ${prop})`
    )
  )
}

export function reportMissingProp(cxt: KeywordCxt, missing: Name): void {
  cxt.setParams({missingProperty: missing}, true)
  cxt.error()
}

function isOwnProperty(data: Name, property: Name | string): Code {
  return _`Object.prototype.hasOwnProperty.call(${data}, ${property})`
}

export function propertyInData(data: Name, property: Name | string, ownProperties?: boolean): Code {
  const cond = _`${data}${getProperty(property)} !== undefined`
  return ownProperties ? _`${cond} && ${isOwnProperty(data, property)}` : cond
}

export function noPropertyInData(
  data: Name,
  property: Name | string,
  ownProperties?: boolean
): Code {
  const cond = _`${data}${getProperty(property)} === undefined`
  return ownProperties ? _`${cond} || !${isOwnProperty(data, property)}` : cond
}

export function allSchemaProperties(schemaMap?: SchemaMap): string[] {
  return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : []
}

export function schemaProperties(it: SchemaCxt, schemaMap: SchemaMap): string[] {
  return allSchemaProperties(schemaMap).filter(
    (p) => !alwaysValidSchema(it, schemaMap[p] as AnySchema)
  )
}

export function callValidateCode(
  {schemaCode, data, it: {gen, topSchemaRef, schemaPath, errorPath}, it}: KeywordCxt,
  func: Code,
  context: Code,
  passSchema?: boolean
): Code {
  const dataAndSchema = passSchema ? _`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data
  const valCxt: [Name, Code | number][] = [
    [N.dataPath, strConcat(N.dataPath, errorPath)],
    [N.parentData, it.parentData],
    [N.parentDataProperty, it.parentDataProperty],
    [N.rootData, N.rootData],
  ]
  if (it.opts.dynamicRef) valCxt.push([N.dynamicAnchors, N.dynamicAnchors])
  const args = _`${dataAndSchema}, ${gen.object(...valCxt)}`
  return context !== nil ? _`${func}.call(${context}, ${args})` : _`${func}(${args})`
}

export function usePattern(gen: CodeGen, pattern: string): Name {
  return gen.scopeValue("pattern", {
    key: pattern,
    ref: new RegExp(pattern, "u"),
    code: _`new RegExp(${pattern}, "u")`,
  })
}
