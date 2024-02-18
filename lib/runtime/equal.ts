// https://github.com/ajv-validator/ajv/issues/889
import {deepEqual} from "fast-equals"

type Equal = typeof deepEqual & {code: string}
;(deepEqual as Equal).code = 'require("ajv/dist/runtime/equal").default'

export default deepEqual as Equal
