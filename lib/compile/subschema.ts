import type {AnySchema} from "../types"
import type {SchemaObjCxt, SchemaCxt} from "./index"
import {subschemaCode} from "./validate"
import {escapeFragment, escapeJsonPointer} from "./util"
import {_, str, Code, Name, getProperty} from "./codegen"
import {JSONType} from "./rules"

interface SubschemaContext {
  // TODO use Optional? align with SchemCxt property types
  schema: AnySchema
  strictSchema?: boolean
  schemaPath: Code
  errSchemaPath: string
  topSchemaRef?: Code
  errorPath?: Code
  dataLevel?: number
  dataTypes?: JSONType[]
  data?: Name
  parentData?: Name
  parentDataProperty?: Code | number
  dataNames?: Name[]
  dataPathArr?: (Code | number)[]
  propertyName?: Name
  compositeRule?: true
  createErrors?: boolean
  allErrors?: boolean
}

export enum Type {
  Num,
  Str,
}

export type SubschemaArgs = Partial<{
  keyword: string
  schemaProp: string | number
  schema: AnySchema
  strictSchema: boolean
  schemaPath: Code
  errSchemaPath: string
  topSchemaRef: Code
  data: Name | Code
  dataProp: Code | string | number
  dataTypes: JSONType[]
  propertyName: Name
  dataPropType: Type
  compositeRule: true
  createErrors: boolean
  allErrors: boolean
}>

export function applySubschema(it: SchemaObjCxt, appl: SubschemaArgs, valid: Name): SchemaCxt {
  const subschema = getSubschema(it, appl)
  extendSubschemaData(subschema, it, appl)
  extendSubschemaMode(subschema, appl)
  const nextContext = {...it, ...subschema, items: undefined, props: undefined}
  subschemaCode(nextContext, valid)
  return nextContext
}

function getSubschema(
  it: SchemaObjCxt,
  {
    keyword,
    schemaProp,
    schema,
    strictSchema,
    schemaPath,
    errSchemaPath,
    topSchemaRef,
  }: SubschemaArgs
): SubschemaContext {
  if (keyword !== undefined && schema !== undefined) {
    throw new Error('both "keyword" and "schema" passed, only one allowed')
  }

  if (keyword !== undefined) {
    const sch = it.schema[keyword]
    return schemaProp === undefined
      ? {
          schema: sch,
          schemaPath: _`${it.schemaPath}${getProperty(keyword)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}`,
        }
      : {
          schema: sch[schemaProp],
          schemaPath: _`${it.schemaPath}${getProperty(keyword)}${getProperty(schemaProp)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}/${escapeFragment(schemaProp)}`,
        }
  }

  if (schema !== undefined) {
    if (schemaPath === undefined || errSchemaPath === undefined || topSchemaRef === undefined) {
      throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"')
    }
    return {
      schema,
      strictSchema,
      schemaPath,
      topSchemaRef,
      errSchemaPath,
    }
  }

  throw new Error('either "keyword" or "schema" must be passed')
}

function extendSubschemaData(
  subschema: SubschemaContext,
  it: SchemaObjCxt,
  {dataProp, dataPropType: dpType, data, dataTypes, propertyName}: SubschemaArgs
): void {
  if (data !== undefined && dataProp !== undefined) {
    throw new Error('both "data" and "dataProp" passed, only one allowed')
  }

  const {gen} = it

  if (dataProp !== undefined) {
    const {errorPath, dataPathArr, opts} = it
    const nextData = gen.let("data", _`${it.data}${getProperty(dataProp)}`, true)
    dataContextProps(nextData)
    subschema.errorPath = str`${errorPath}${getErrorPath(dataProp, dpType, opts.jsPropertySyntax)}`
    subschema.parentDataProperty = _`${dataProp}`
    subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty]
  }

  if (data !== undefined) {
    const nextData = data instanceof Name ? data : gen.let("data", data, true) // replaceable if used once?
    dataContextProps(nextData)
    if (propertyName !== undefined) subschema.propertyName = propertyName
    // TODO something is possibly wrong here with not changing parentDataProperty and not appending dataPathArr
  }

  if (dataTypes) subschema.dataTypes = dataTypes

  function dataContextProps(_nextData: Name): void {
    subschema.data = _nextData
    subschema.dataLevel = it.dataLevel + 1
    subschema.dataTypes = []
    subschema.parentData = it.data
    subschema.dataNames = [...it.dataNames, _nextData]
  }
}

function extendSubschemaMode(
  subschema: SubschemaContext,
  {compositeRule, createErrors, allErrors, strictSchema}: SubschemaArgs
): void {
  if (compositeRule !== undefined) subschema.compositeRule = compositeRule
  if (createErrors !== undefined) subschema.createErrors = createErrors
  if (allErrors !== undefined) subschema.allErrors = allErrors
  subschema.strictSchema = strictSchema // not inherited
}

function getErrorPath(
  dataProp: Name | string | number,
  dataPropType?: Type,
  jsPropertySyntax?: boolean
): Code | string {
  // let path
  if (dataProp instanceof Name) {
    const isNumber = dataPropType === Type.Num
    return jsPropertySyntax
      ? isNumber
        ? _`"[" + ${dataProp} + "]"`
        : _`"['" + ${dataProp} + "']"`
      : isNumber
      ? _`"/" + ${dataProp}`
      : _`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")` // TODO maybe use global escapePointer
  }
  return jsPropertySyntax ? getProperty(dataProp).toString() : "/" + escapeJsonPointer(dataProp)
}
