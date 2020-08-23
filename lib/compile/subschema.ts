import {CompilationContext} from "../types"
import validateCode from "./validate"
import {getProperty, escapeFragment, getPath, getPathExpr} from "./util"
import {quotedString} from "../vocabularies/util"

export interface SubschemaContext {
  schema: any
  schemaPath: string
  errSchemaPath: string
  errorPath?: string
  dataPathArr?: (string | number)[]
  dataLevel?: number
  compositeRule?: true
}

export enum Expr {
  Const,
  Num,
  Str,
}

export interface SubschemaApplication {
  keyword: string
  schemaProp?: string | number
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
  {keyword, schemaProp, data, dataProp, expr, ...rest}: SubschemaApplication,
  valid: string
): void {
  const schema = it.schema[keyword]
  const subschema: SubschemaContext =
    schemaProp === undefined
      ? {
          schema: schema,
          schemaPath: it.schemaPath + getProperty(keyword),
          errSchemaPath: `${it.errSchemaPath}/${keyword}`,
        }
      : {
          schema: schema[schemaProp],
          schemaPath: it.schemaPath + getProperty(keyword) + getProperty(schemaProp),
          errSchemaPath: `${it.errSchemaPath}/${keyword}/${escapeFragment("" + schemaProp)}`,
        }

  if (data !== undefined && dataProp !== undefined) {
    throw new Error('both "data" and "dataProp" are passed, only one allowed')
  } else if (dataProp !== undefined) {
    const {gen, errorPath, dataPathArr, dataLevel, opts} = it
    // TODO possibly refactor getPath and getPathExpr to one function using Expr enum
    const nextLevel = dataLevel + 1
    Object.assign(subschema, {
      errorPath:
        expr === Expr.Const
          ? getPath(errorPath, dataProp, opts.jsonPointers)
          : getPathExpr(errorPath, <string>dataProp, opts.jsonPointers, expr === Expr.Num),
      dataPathArr: [
        ...dataPathArr,
        expr === Expr.Const && typeof dataProp == "string" ? quotedString(dataProp) : dataProp,
      ],
      dataLevel: nextLevel,
    })

    // TODO refactor - use accessProperty
    const passDataProp = expr === Expr.Const ? getProperty(dataProp) : `[${dataProp}]`
    gen.code(`var data${nextLevel} = data${dataLevel || ""}${passDataProp};`)
  } else if (data !== undefined) {
    const {gen, dataLevel} = it
    const nextLevel = dataLevel + 1
    subschema.dataLevel = nextLevel
    gen.code(`var data${nextLevel} = ${data};`)
  }

  Object.assign(subschema, rest)

  const nextContext = {...it, ...subschema, level: it.level + 1}
  // TODO remove "true" once appendGen is removed
  validateCode(nextContext, valid, true)
}
