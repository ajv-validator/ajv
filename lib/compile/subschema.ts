import {CompilationContext} from "../types"
import validateCode from "./validate"
import {getProperty, escapeFragment, getPath, getPathExpr} from "./util"

export interface SubschemaContext {
  schema: any
  schemaPath: string
  errSchemaPath: string
  errorPath?: string
  dataPathArr?: (string | number)[]
  dataLevel?: number
  compositeRule?: true
}

export function applySchema(it: CompilationContext, subschema: SubschemaContext): string {
  const {gen, level} = it
  const nextContext = {...it, ...subschema, level: level + 1}
  const nextValid = gen.name("valid")
  // TODO remove true once appendGen is removed
  validateCode(nextContext, nextValid, true)
  return nextValid
}

export enum Expr {
  Const,
  Num,
  Str,
}

interface SubschemaApplication {
  keyword: string
  schemaProp?: string | number
  compositeRule?: true
  dataProp?: string | number
  expr?: Expr
}

export function applySubschema(
  it: CompilationContext,
  {keyword, schemaProp, compositeRule, dataProp, expr}: SubschemaApplication
): string {
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

  if (dataProp !== undefined) {
    const {gen, errorPath, dataPathArr, dataLevel, opts} = it
    // TODO possibly refactor getPath and getPathExpr to one function using Expr enum
    const nextLevel = dataLevel + 1
    Object.assign(subschema, {
      errorPath:
        expr === Expr.Const
          ? getPath(errorPath, dataProp, opts.jsonPointers)
          : getPathExpr(errorPath, <string>dataProp, opts.jsonPointers, expr === Expr.Num),
      dataPathArr: [...dataPathArr, dataProp],
      dataLevel: nextLevel,
    })

    const passDataProp = Expr.Const ? getProperty(dataProp) : `[${dataProp}]`
    gen.code(`var data${nextLevel} = data${dataLevel || ""}${passDataProp};`)
  }

  if (compositeRule) subschema.compositeRule = compositeRule
  return applySchema(it, subschema)
}
