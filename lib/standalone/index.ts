import type Ajv from "../ajv"
import type {AnyValidateFunction, SourceCode} from "../types"
import type {ScopeValueSets, ValueScopeName} from "../compile/codegen/scope"
import {_, _Code, Code, getProperty} from "../compile/codegen/code"
import {SchemaEnv} from "../compile"

export default function standaloneCode(
  ajv: Ajv,
  refsOrValidate?: AnyValidateFunction | {[K in string]?: string}
): string {
  if (!ajv.opts.code.source) {
    throw new Error("moduleCode: ajv instance must have code.source option")
  }
  switch (typeof refsOrValidate) {
    case "function":
      return funcExportCode(ajv, refsOrValidate.source)
    case "object":
      return multiExportsCode(ajv, refsOrValidate)
    default:
      return allExportsCode(ajv)
  }
}

function funcExportCode(ajv: Ajv, source?: SourceCode): string {
  const usedValues: ScopeValueSets = {}
  const vCode = validateCode(ajv, usedValues, source)
  const v = source?.validateName
  return `"use strict";module.exports = ${v};module.exports.default = ${v};${vCode}`
}

function multiExportsCode(ajv: Ajv, refs: {[K in string]?: string}): string {
  const usedValues: ScopeValueSets = {}
  let code = _`"use strict";`
  for (const name in refs) {
    const id = refs[name] as string
    code = _`${code}${exportCode(ajv, usedValues, name, id)}`
  }
  return `${code}`
}

function allExportsCode(ajv: Ajv): string {
  const usedValues: ScopeValueSets = {}
  const addedExports: Set<SchemaEnv | string> = new Set()
  let code = _`"use strict";`
  for (const key in ajv.schemas) addExport(key, ajv.schemas[key] as SchemaEnv)
  for (const ref in ajv.refs) addExport(ref, ajv.refs[ref] as SchemaEnv | string)
  return `${code}`

  function addExport(name: string, schOrId: SchemaEnv | string): void {
    if (addedExports.has(schOrId) || isMeta(schOrId)) return
    addedExports.add(schOrId)
    code = _`${code}${exportCode(ajv, usedValues, name, schOrId)}`
  }

  function isMeta(schOrId: SchemaEnv | string): boolean | undefined {
    return typeof schOrId == "object" ? schOrId.meta : ajv.getSchema(schOrId)?.schemaEnv.meta
  }
}

function exportCode(
  ajv: Ajv,
  usedValues: ScopeValueSets,
  name: string,
  schOrId: SchemaEnv | string
): Code {
  const v = typeof schOrId === "object" ? ajv.compile(schOrId.schema) : ajv.getSchema(schOrId)
  if (!v) throw new Error(`moduleCode: no schema with id ${schOrId}`)
  const vCode = validateCode(ajv, usedValues, v.source)
  return _`exports${getProperty(name)} = ${v.source?.validateName};${vCode}`
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
