import {KeywordContext, KeywordErrorDefinition} from "../types"
import {noPropertyInData, quotedString} from "./util"
import {reportError} from "../compile/errors"
import {Expr} from "../compile/subschema"

export function checkReportMissingProp(
  cxt: KeywordContext,
  prop: string,
  error: KeywordErrorDefinition
): void {
  const {
    gen,
    errorParams,
    data,
    it: {opts},
  } = cxt
  gen.if(noPropertyInData(data, prop, Expr.Const, opts.ownProperties), () => {
    errorParams({missingProperty: quotedString(prop)}, true)
    reportError(cxt, error)
  })
}

export function checkMissingProp(
  {data, it: {opts}}: KeywordContext,
  properties: string[],
  missing: string
): string {
  return properties
    .map((prop) => {
      const hasNoProp = noPropertyInData(data, prop, Expr.Const, opts.ownProperties)
      return `(${hasNoProp} && (${missing} = ${quotedString(prop)}))`
    })
    .reduce((cond, part) => `${cond} || ${part}`)
}

export function reportMissingProp(
  cxt: KeywordContext,
  missing: string,
  error: KeywordErrorDefinition
): void {
  cxt.errorParams({missingProperty: missing}, true)
  reportError(cxt, error)
}
