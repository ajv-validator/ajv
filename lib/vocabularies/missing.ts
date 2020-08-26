import {KeywordContext, KeywordErrorDefinition} from "../types"
import {noPropertyInData, quotedString, orExpr} from "./util"
import {reportError} from "../compile/errors"
import {Name, _} from "../compile/codegen"

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
  gen.if(noPropertyInData(data, prop, opts.ownProperties), () => {
    errorParams({missingProperty: _`${prop}`}, true)
    reportError(cxt, error)
  })
}

export function checkMissingProp(
  {data, it: {opts}}: KeywordContext,
  properties: string[],
  missing: Name
): string {
  return orExpr(properties, (prop) => {
    const hasNoProp = noPropertyInData(data, prop, opts.ownProperties)
    return `(${hasNoProp} && (${missing} = ${quotedString(prop)}))`
  })
}

export function reportMissingProp(
  cxt: KeywordContext,
  missing: Name,
  error: KeywordErrorDefinition
): void {
  cxt.errorParams({missingProperty: missing}, true)
  reportError(cxt, error)
}
