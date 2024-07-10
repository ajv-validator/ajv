// https://github.com/ajv-validator/ajv/issues/889
import { dequal as equal } from "dequal"

type Equal = typeof equal & {code: string}
;(equal as Equal).code = 'require("ajv/dist/runtime/equal").default'

export default equal as Equal
