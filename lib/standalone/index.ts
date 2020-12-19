import type AjvCore from "../core"
import type {AnyValidateFunction, SourceCode} from "../types"
import type {SchemaEnv} from "../compile"
import {ScopeValueSets, ValueScopeName, varKinds} from "../compile/codegen/scope"
import {_, _Code, Code, getProperty} from "../compile/codegen/code"

export default function standaloneCode(
  ajv: AjvCore,
  refsOrFunc?: {[K in string]?: string} | AnyValidateFunction
): string {
  if (!ajv.opts.code.source) {
    throw new Error("moduleCode: ajv instance must have code.source option")
  }
  const {_n} = ajv.scope.opts
  return typeof refsOrFunc == "function"
    ? funcExportCode(refsOrFunc.source)
    : refsOrFunc !== undefined
    ? multiExportsCode<string>(refsOrFunc, getValidate)
    : multiExportsCode<SchemaEnv>(ajv.schemas, (sch) =>
        sch.meta ? undefined : ajv.compile(sch.schema)
      )

  function getValidate(id: string): AnyValidateFunction {
    const v = ajv.getSchema(id)
    if (!v) throw new Error(`moduleCode: no schema with id ${id}`)
    return v
  }

  function funcExportCode(source?: SourceCode): string {
    const usedValues: ScopeValueSets = {}
    const n = source?.validateName
    const vCode = validateCode(usedValues, source)
    return `"use strict";${_n}module.exports = ${n};${_n}module.exports.default = ${n};${_n}${vCode}`
  }

  function multiExportsCode<T extends SchemaEnv | string>(
    schemas: {[K in string]?: T},
    getValidateFunc: (schOrId: T) => AnyValidateFunction | undefined
  ): string {
    const usedValues: ScopeValueSets = {}
    let code = _`"use strict";`
    for (const name in schemas) {
      const v = getValidateFunc(schemas[name] as T)
      if (v) {
        const vCode = validateCode(usedValues, v.source)
        code = _`${code}${_n}exports${getProperty(name)} = ${v.source?.validateName};${_n}${vCode}`
      }
    }
    return `${code}`
  }

  function validateCode(usedValues: ScopeValueSets, s?: SourceCode): Code {
    if (!s) throw new Error('moduleCode: function does not have "source" property')
    const {prefix} = s.validateName
    const nameSet = (usedValues[prefix] = usedValues[prefix] || new Set())
    nameSet.add(s.validateName)

    const scopeCode = ajv.scope.scopeCode(s.scopeValues, usedValues, refValidateCode)
    const code = new _Code(`${scopeCode}${_n}${s.validateCode}`)
    return s.evaluated ? _`${code}${s.validateName}.evaluated = ${s.evaluated};${_n}` : code

    function refValidateCode(n: ValueScopeName): Code | undefined {
      const vRef = n.value?.ref
      if (n.prefix === "validate" && typeof vRef == "function") {
        const v = vRef as AnyValidateFunction
        return validateCode(usedValues, v.source)
      } else if ((n.prefix === "root" || n.prefix === "wrapper") && typeof vRef == "object") {
        const {validate, validateName} = vRef as SchemaEnv
        const vCode = validateCode(usedValues, validate?.source)
        const def = ajv.opts.code.es5 ? varKinds.var : varKinds.const
        return _`${def} ${n} = {validate: ${validateName}};${_n}${vCode}`
      }
      return undefined
    }
  }
}
