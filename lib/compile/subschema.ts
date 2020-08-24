import {CompilationContext} from "../types"
import validateCode from "./validate"
import {getProperty, escapeFragment, getPath, getPathExpr} from "./util"
import {quotedString} from "../vocabularies/util"

export interface SubschemaContext {
  schema: object | boolean
  schemaPath: string
  errSchemaPath: string
  topSchemaRef?: string
  errorPath?: string
  dataPathArr?: (string | number)[]
  dataLevel?: number
  propertyName?: string
  compositeRule?: true
  createErrors?: boolean
  allErrors?: boolean
}

export enum Expr {
  Const,
  Num,
  Str,
}

export interface SubschemaApplication {
  keyword?: string
  schemaProp?: string | number
  schema?: object | boolean
  schemaPath?: string
  errSchemaPath?: string
  topSchemaRef?: string
  data?: string
  dataProp?: string | number
  propertyName?: string
  expr?: Expr
  compositeRule?: true
  createErrors?: boolean
  allErrors?: boolean
}

export function applySubschema(
  it: CompilationContext,
  appl: SubschemaApplication,
  valid: string
): void {
  const subschema = getSubschema(it, appl)
  extendSubschemaData(subschema, it, appl)
  extendSubschemaMode(subschema, appl)
  const nextContext = {...it, ...subschema, level: it.level + 1}
  // TODO remove "true" once appendGen is removed
  validateCode(nextContext, valid, true)
}

function getSubschema(
  it: CompilationContext,
  {keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef}: SubschemaApplication
): SubschemaContext {
  if (keyword !== undefined && schema !== undefined) {
    throw new Error('both "keyword" and "schema" passed, only one allowed')
  }

  if (keyword !== undefined) {
    const sch = it.schema[keyword]
    return schemaProp === undefined
      ? {
          schema: sch,
          schemaPath: it.schemaPath + getProperty(keyword),
          errSchemaPath: `${it.errSchemaPath}/${keyword}`,
        }
      : {
          schema: sch[schemaProp],
          schemaPath: it.schemaPath + getProperty(keyword) + getProperty(schemaProp),
          errSchemaPath: `${it.errSchemaPath}/${keyword}/${escapeFragment("" + schemaProp)}`,
        }
  }

  if (schema !== undefined) {
    if (schemaPath === undefined || topSchemaRef === undefined) {
      throw new Error('"schemaPath" and "topSchemaRef" are required with "schema"')
    }
    return {
      schema,
      schemaPath,
      topSchemaRef,
      errSchemaPath: errSchemaPath || it.errSchemaPath,
    }
  }

  throw new Error('either "keyword" or "schema" must be passed')
}

function extendSubschemaData(
  subschema: SubschemaContext,
  it: CompilationContext,
  {dataProp, expr, data, propertyName}: SubschemaApplication
) {
  if (data !== undefined && dataProp !== undefined) {
    throw new Error('both "data" and "dataProp" passed, only one allowed')
  }

  if (dataProp !== undefined) {
    const {gen, errorPath, dataPathArr, dataLevel, opts} = it
    // TODO possibly refactor getPath and getPathExpr to one function using Expr enum
    const nextLevel = dataLevel + 1
    subschema.errorPath =
      expr === Expr.Const
        ? getPath(errorPath, dataProp, opts.jsonPointers)
        : getPathExpr(errorPath, <string>dataProp, opts.jsonPointers, expr === Expr.Num)
    subschema.dataPathArr = [
      ...dataPathArr,
      expr === Expr.Const && typeof dataProp == "string" ? quotedString(dataProp) : dataProp,
    ]
    subschema.dataLevel = nextLevel

    // TODO refactor - use accessProperty
    const passDataProp = expr === Expr.Const ? getProperty(dataProp) : `[${dataProp}]`
    gen.code(`var data${nextLevel} = data${dataLevel || ""}${passDataProp};`)
  }

  if (data !== undefined) {
    const {gen, dataLevel} = it
    const nextLevel = dataLevel + 1
    subschema.dataLevel = nextLevel
    if (propertyName !== undefined) subschema.propertyName = propertyName
    gen.code(`var data${nextLevel} = ${data};`)
  }
}

function extendSubschemaMode(
  subschema: SubschemaContext,
  {compositeRule, createErrors, allErrors}: SubschemaApplication
) {
  if (compositeRule !== undefined) subschema.compositeRule = compositeRule
  if (createErrors !== undefined) subschema.createErrors = createErrors
  if (allErrors !== undefined) subschema.allErrors = allErrors
}
