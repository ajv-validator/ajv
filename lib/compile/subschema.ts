import {CompilationContext} from "../types"
import {subschemaCode} from "./validate"
import {escapeFragment, getPath, getPathExpr} from "./util"
import {_, Code, Name, Expression, getProperty} from "./codegen"

export interface SubschemaContext {
  // TODO use Optional?
  schema: object | boolean
  schemaPath: Code
  errSchemaPath: string
  topSchemaRef?: Code
  errorPath?: string
  dataLevel?: number
  data?: Name
  parentData?: Name
  parentDataProperty?: Code | number
  dataNames?: Name[]
  dataPathArr?: (Expression | number)[]
  propertyName?: Name
  compositeRule?: true
  createErrors?: boolean
  allErrors?: boolean
}

export enum Expr {
  Const,
  Num,
  Str,
}

export type SubschemaApplication = Partial<SubschemaApplicationParams>

interface SubschemaApplicationParams {
  keyword: string
  schemaProp: string | number
  schema: object | boolean
  schemaPath: Code
  errSchemaPath: string
  topSchemaRef: Code
  data: Name | Code
  dataProp: Expression | number
  propertyName: Name
  expr: Expr
  compositeRule: true
  createErrors: boolean
  allErrors: boolean
}

export function applySubschema(
  it: CompilationContext,
  appl: SubschemaApplication,
  valid: Name
): void {
  const subschema = getSubschema(it, appl)
  extendSubschemaData(subschema, it, appl)
  extendSubschemaMode(subschema, appl)
  const nextContext = {...it, ...subschema}
  subschemaCode(nextContext, valid)
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
          schemaPath: _`${it.schemaPath}${getProperty(keyword)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}`,
        }
      : {
          schema: sch[schemaProp],
          schemaPath: _`${it.schemaPath}${getProperty(keyword)}${getProperty(schemaProp)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}/${escapeFragment("" + schemaProp)}`,
        }
  }

  if (schema !== undefined) {
    if (schemaPath === undefined || errSchemaPath === undefined || topSchemaRef === undefined) {
      throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"')
    }
    return {
      schema,
      schemaPath,
      topSchemaRef,
      errSchemaPath,
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

  const {gen} = it

  if (dataProp !== undefined) {
    const {errorPath, dataPathArr, opts} = it
    const nextData = gen.var("data", _`${it.data}${getProperty(dataProp)}`) // TODO var
    dataContextProps(nextData)
    // TODO possibly refactor getPath and getPathExpr to one function using Expr enum
    subschema.errorPath =
      dataProp instanceof Code
        ? getPathExpr(errorPath, dataProp, opts.jsonPointers, expr === Expr.Num)
        : getPath(errorPath, dataProp, opts.jsonPointers)

    subschema.parentDataProperty = _`${dataProp}`
    subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty]
  }

  if (data !== undefined) {
    const nextData = data instanceof Name ? data : gen.var("data", data) // TODO var, replaceable if used once?
    dataContextProps(nextData)
    if (propertyName !== undefined) subschema.propertyName = propertyName
    // TODO something is wrong here with not changing parentDataProperty and not appending dataPathArr
  }

  function dataContextProps(_nextData: Name) {
    subschema.data = _nextData
    subschema.dataLevel = it.dataLevel + 1
    subschema.parentData = it.data
    subschema.dataNames = [...it.dataNames, _nextData]
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
