import type Ajv from "../ajv"
import type {AnyValidateFunction, SourceCode} from "../types"
import type {ScopeValueSets, ValueScopeName} from "../compile/codegen/scope"
import {_Code, Code, _} from "../compile/codegen/code"
import {SchemaEnv} from "../compile"

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
  return `"use strict";module.exports = ${source?.validateName};${validateCode(source)}`

  function validateCode(s?: SourceCode): Code {
    if (!s) throw new Error('moduleCode: function does not have "source" property')
    const scopeCode = ajv.scope.scopeCode(s.scopeValues, usedValues, refValidateCode)
    const code = new _Code(`${scopeCode}${s.validateCode}`)
    return s.evaluated ? _`${code}${s.validateName}.evaluated = ${s.evaluated};` : code
  }

  function refValidateCode(n: ValueScopeName): Code | undefined {
    const vRef = n.value?.ref
    if (n.prefix === "validate" && typeof vRef == "function") {
      const v = vRef as AnyValidateFunction
      return validateCode(v.source)
    } else if (n.prefix === "root" && typeof vRef == "object") {
      const env = vRef as SchemaEnv
      return _`const ${n} = {validate: ${env.validateName}};${validateCode(env.validate?.source)}`
    }
    return undefined
  }
}

function multiExportCode(_ajv: Ajv, _refs: {[K in string]?: string}): string {
  return ""
}