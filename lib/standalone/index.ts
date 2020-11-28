import type Ajv from "../ajv"
import type {AnyValidateFunction, SourceCode} from "../types"
import type {ScopeValueSets, ValueScopeName} from "../compile/codegen/scope"
import {_, _Code, Code, getProperty} from "../compile/codegen/code"
import {SchemaEnv} from "../compile"

export default function standaloneCode(
  ajv: Ajv,
  refsOrValidate: AnyValidateFunction | {[K in string]?: string}
): string {
  if (!ajv.opts.code.source) {
    throw new Error("moduleCode: ajv instance must have code.source option")
  }
  return typeof refsOrValidate == "function"
    ? funcExportCode(ajv, refsOrValidate.source)
    : multiExportCode(ajv, refsOrValidate)
}

function funcExportCode(ajv: Ajv, source?: SourceCode): string {
  const usedValues: ScopeValueSets = {}
  const vCode = validateCode(ajv, usedValues, source)
  const v = source?.validateName
  return `"use strict";module.exports = ${v};module.exports.default = ${v};${vCode}`
}

function multiExportCode(ajv: Ajv, refs: {[K in string]?: string}): string {
  const usedValues: ScopeValueSets = {}
  let code = _`"use strict";`
  for (const name in refs) {
    const id = refs[name] as string
    const v = ajv.getSchema(id)
    if (!v) throw new Error(`moduleCode: no schema with id ${id}`)
    const vCode = validateCode(ajv, usedValues, v.source)
    code = _`${code}exports${getProperty(name)} = ${v.source?.validateName};${vCode}`
  }
  return code.toString()
}

function validateCode(ajv: Ajv, usedValues: ScopeValueSets, s?: SourceCode): Code {
  if (!s) throw new Error('moduleCode: function does not have "source" property')
  const scopeCode = ajv.scope.scopeCode(s.scopeValues, usedValues, refValidateCode)
  const code = new _Code(`${scopeCode}${s.validateCode}`)
  return s.evaluated ? _`${code}${s.validateName}.evaluated = ${s.evaluated};` : code

  function refValidateCode(n: ValueScopeName): Code | undefined {
    const vRef = n.value?.ref
    if (n.prefix === "validate" && typeof vRef == "function") {
      const v = vRef as AnyValidateFunction
      return validateCode(ajv, usedValues, v.source)
    } else if (n.prefix === "root" && typeof vRef == "object") {
      const {validate, validateName} = vRef as SchemaEnv
      const vCode = validateCode(ajv, usedValues, validate?.source)
      return _`const ${n} = {validate: ${validateName}};${vCode}`
    }
    return undefined
  }
}
