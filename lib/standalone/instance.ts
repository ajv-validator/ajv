import Ajv, {AnySchema, AnyValidateFunction, ErrorObject} from "../core"
import standaloneCode from "."
import requireFromString = require("require-from-string")

export default class AjvPackFunc {
  errors?: ErrorObject[] | null // errors from the last validation
  constructor(readonly ajv: Ajv) {}

  validate<T = unknown>(schemaKeyRef: AnySchema | string, data: unknown | T): boolean | Promise<T> {
    let v: AnyValidateFunction | undefined
    if (typeof schemaKeyRef == "string") {
      v = this.getSchema<T>(schemaKeyRef)
      if (!v) throw new Error('no schema with key or ref "' + schemaKeyRef + '"')
    } else {
      v = this.compile<T>(schemaKeyRef)
    }
    const valid = v(data)
    this.errors = valid ? null : v.errors
    return valid
  }

  compile<T = unknown>(schema: AnySchema, _meta?: boolean): AnyValidateFunction<T> {
    return this.getStandalone(this.ajv.compile<T>(schema))
  }

  getSchema<T = unknown>(keyRef: string): AnyValidateFunction<T> | undefined {
    const v = this.ajv.getSchema<T>(keyRef)
    if (!v) return undefined
    return this.getStandalone(v)
  }

  private getStandalone<T = unknown>(v: AnyValidateFunction<T>): AnyValidateFunction<T> {
    const validateModule = standaloneCode(this.ajv, v)
    return requireFromString(validateModule) as AnyValidateFunction<T>
  }

  addSchema(...args: Parameters<typeof Ajv.prototype.addSchema>): AjvPackFunc {
    this.ajv.addSchema.call(this.ajv, ...args)
    return this
  }

  addKeyword(...args: Parameters<typeof Ajv.prototype.addKeyword>): AjvPackFunc {
    this.ajv.addKeyword.call(this.ajv, ...args)
    return this
  }
}
