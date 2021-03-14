// https://github.com/ajv-validator/ajv/issues/889
import {_, _Code} from "../compile/codegen/code"
import * as equal from "fast-deep-equal"

type Equal = typeof equal & {code: _Code}
;(equal as Equal).code = _`require("ajv/dist/runtime/equal").default`

export default equal as Equal
