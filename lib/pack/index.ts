import type Ajv from "../ajv"
import type {AnyValidateFunction, SourceCode} from "../types"
import type {ScopeValueSets, ValueScopeName} from "../compile/codegen/scope"
import {_Code, Code} from "../compile/codegen/code"

export default function moduleCode(
  this: Ajv,
  refsOrValidate: AnyValidateFunction | {[K in string]?: string}
): string {
  if (!this.opts.code.source) {
    throw new Error("moduleCode: ajv instance must have code.source option")
  }
  return typeof refsOrValidate == "function"
    ? funcExportCode(this, refsOrValidate.source)
    : multiExportCode(this, refsOrValidate)
}

function funcExportCode(ajv: Ajv, source?: SourceCode): string {
  const usedValues: ScopeValueSets = {}
  return `"use strict"\nmodule.exports = ${validateCode(source)}`

  function validateCode(s?: SourceCode): Code {
    if (!s) throw new Error('moduleCode: function does not have "source" property')
    const scopeCode = ajv.scope.scopeCode(s.scopeValues, usedValues, refValidateCode)
    return new _Code(`${s.code}\n${scopeCode}\n`)
  }

  function refValidateCode(n: ValueScopeName): Code | undefined {
    const v = n.value?.ref
    return typeof v == "function" ? validateCode((v as AnyValidateFunction).source) : undefined
  }
}

function multiExportCode(_ajv: Ajv, _refs: {[K in string]?: string}): string {
  return ""
}
