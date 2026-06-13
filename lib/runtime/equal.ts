// https://github.com/ajv-validator/ajv/issues/889
// https://github.com/ajv-validator/ajv/issues/2624
//
// Vendored from `fast-deep-equal` (which is unmaintained) with a guard around
// the `valueOf`/`toString` shortcuts. The upstream implementation calls
// `a.valueOf()`/`a.toString()` after only checking that the property differs
// from `Object.prototype`, so a plain JSON value that shadows them with a
// non-function (e.g. `{toString: ""}`) makes the call throw a `TypeError`.
// Such values are valid JSON input, so `uniqueItems`, `enum` and `const` must
// not crash on them.

function equalArrays(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false
  for (let i = a.length; i-- !== 0; ) if (!equal(a[i], b[i])) return false
  return true
}

// Returns the result of the `valueOf`/`toString` shortcut, or `null` when
// neither applies (so the caller falls back to comparing own keys). A shadowed
// non-function `valueOf`/`toString` is treated as a regular property rather
// than being invoked.
function equalByCustomMethod(a: any, b: any): boolean | null {
  const aValueOf = a.valueOf
  if (typeof aValueOf === "function" && aValueOf !== Object.prototype.valueOf) {
    const bValueOf = b.valueOf
    if (typeof bValueOf !== "function") return false
    return (aValueOf as () => unknown).call(a) === (bValueOf as () => unknown).call(b)
  }
  const aToString = a.toString
  if (typeof aToString === "function" && aToString !== Object.prototype.toString) {
    const bToString = b.toString
    if (typeof bToString !== "function") return false
    return (aToString as () => unknown).call(a) === (bToString as () => unknown).call(b)
  }
  return null
}

function equalKeys(a: any, b: any): boolean {
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!equal(a[key], b[key])) return false
  }
  return true
}

function equal(a: any, b: any): boolean {
  if (a === b) return true

  if (a && b && typeof a === "object" && typeof b === "object") {
    if (a.constructor !== b.constructor) return false
    if (Array.isArray(a)) return equalArrays(a, b)
    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags
    const byMethod = equalByCustomMethod(a, b)
    if (byMethod !== null) return byMethod
    return equalKeys(a, b)
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b
}

type Equal = typeof equal & {code: string}
;(equal as Equal).code = 'require("ajv/dist/runtime/equal").default'

export default equal as Equal
