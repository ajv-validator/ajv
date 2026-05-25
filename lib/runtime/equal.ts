// https://github.com/ajv-validator/ajv/issues/889
import * as equal from "fast-deep-equal"

// Guard against TypeError when objects have non-function toString/valueOf properties
// (see https://github.com/ajv-validator/ajv/issues/2624)
function safeEqual(a: unknown, b: unknown): boolean {
  if (a && typeof a === "object") {
    safeGuard(a as Record<string, unknown>)
  }
  if (b && typeof b === "object") {
    safeGuard(b as Record<string, unknown>)
  }
  return equal(a, b)
}

function safeGuard(obj: Record<string, unknown>) {
  if (typeof obj.toString !== "function") {
    obj.toString = Object.prototype.toString as () => string
  }
  if (typeof obj.valueOf !== "function") {
    obj.valueOf = Object.prototype.valueOf as () => unknown
  }
}

type Equal = typeof equal & {code: string}
;(safeEqual as Equal).code = 'require("ajv/dist/runtime/equal").default'

export default safeEqual as Equal
