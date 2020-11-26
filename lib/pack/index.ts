import Ajv from "../ajv"
import {ValidateFunction} from "../types"

export default function moduleCode(
  this: Ajv,
  refsOrValidate: ValidateFunction | {[K in string]?: string}
): string {
  if (!this.opts.code.source) {
    throw new Error("moduleCode: ajv instance must have code.source option")
  }
  if (typeof refsOrValidate == "function") {
    const code = this.scope.scopeCode(refsOrValidate.source?.scopeValues)
    return `${code}module.exports = ${refsOrValidate.toString()}`
  }
  return ""
}
