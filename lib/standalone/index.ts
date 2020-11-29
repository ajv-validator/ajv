import type Ajv from "../ajv"
import type {AnyValidateFunction, SourceCode} from "../types"
import type {ScopeValueSets, ValueScopeName} from "../compile/codegen/scope"
import {_, _Code, Code, getProperty} from "../compile/codegen/code"
import {SchemaEnv} from "../compile"

type HashMap<T> = {[K in string]?: T}

export default function standaloneCode(
  ajv: Ajv,
  refsOrFunc?: HashMap<string> | AnyValidateFunction
): string {
  if (!ajv.opts.code.source) {
    throw new Error("moduleCode: ajv instance must have code.source option")
  }
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
    return `"use strict";module.exports = ${n};module.exports.default = ${n};${vCode}`
  }

  function multiExportsCode<T extends SchemaEnv | string>(
    schemas: HashMap<T>,
    getValidateFunc: (schOrId: T) => AnyValidateFunction | undefined
  ): string {
    const usedValues: ScopeValueSets = {}
    let code = _`"use strict";`
    for (const name in schemas) {
      const v = getValidateFunc(schemas[name] as T)
      if (v) {
        const vCode = validateCode(usedValues, v.source)
        code = _`${code}exports${getProperty(name)} = ${v.source?.validateName};${vCode}`
      }
    }
    return `${code}`
  }

  function validateCode(usedValues: ScopeValueSets, s?: SourceCode): Code {
    if (!s) throw new Error('moduleCode: function does not have "source" property')
    const scopeCode = ajv.scope.scopeCode(s.scopeValues, usedValues, refValidateCode)
    const code = new _Code(`${scopeCode}${s.validateCode}`)
    return s.evaluated ? _`${code}${s.validateName}.evaluated = ${s.evaluated};` : code

    function refValidateCode(n: ValueScopeName): Code | undefined {
      const vRef = n.value?.ref
      if (n.prefix === "validate" && typeof vRef == "function") {
        const v = vRef as AnyValidateFunction
        return validateCode(usedValues, v.source)
      } else if (n.prefix === "root" && typeof vRef == "object") {
        const {validate, validateName} = vRef as SchemaEnv
        const vCode = validateCode(usedValues, validate?.source)
        return _`const ${n} = {validate: ${validateName}};${vCode}`
      }
      return undefined
    }
  }
}
