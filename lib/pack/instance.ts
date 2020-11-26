import Ajv, {AnySchema, AnyValidateFunction, ErrorObject} from "../core"
import moduleCode from "."
import requireFromString = require("require-from-string")

export default class AjvPackFunc {
  errors?: ErrorObject[] | null // errors from the last validation
  constructor(readonly ajv: Ajv) {}

  validate<T = unknown>(schema: AnySchema, data: unknown | T): boolean | Promise<T> {
    const v = this.compile<T>(schema)
    const valid = v(data)
    this.errors = valid ? null : v.errors
    return valid
  }

  compile<T = unknown>(schema: AnySchema, _meta?: boolean): AnyValidateFunction<T> {
    const v = this.ajv.compile(schema)
    const validateModule = moduleCode.call(this.ajv, v)
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
