// https://github.com/ajv-validator/ajv/issues/889
import * as equal from "fast-deep-equal"

// Guard against TypeError when objects have non-function toString/valueOf properties
// (see https://github.com/ajv-validator/ajv/issues/2624)
function safeEqual(a: unknown, b: unknown): boolean {
  if (a && typeof a === "object") {
    safeGuard(a)
  }
  if (b && typeof b === "object") {
    safeGuard(b)
  }
  return equal(a, b)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeGuard(obj: any) {
  if (typeof obj.toString !== "function") {
    obj.toString = Object.prototype.toString
  }
  if (typeof obj.valueOf !== "function") {
    obj.valueOf = Object.prototype.valueOf
  }
}

type Equal = typeof equal & {code: string}
;(safeEqual as Equal).code = 'require("ajv/dist/runtime/equal").default'

export default safeEqual as Equal
