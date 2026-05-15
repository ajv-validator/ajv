// https://github.com/ajv-validator/ajv/issues/889
import * as equal from "fast-deep-equal"

type Equal = typeof equal & {code: string; import: readonly [string, string]}
;(equal as Equal).code = 'require("ajv/dist/runtime/equal").default'
;(equal as Equal).import = ["equal", "ajv/dist/runtime/equal"]

const asEqual: Equal = equal as Equal
export default equal as Equal
export {asEqual as equal}
