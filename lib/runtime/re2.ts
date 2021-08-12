import * as re2 from "re2"

// interface RegExpLike {
//    test: (s: string) => boolean
// }
// type RegExpEngine = (pattern: string, u: string) => RegExpLike

type Re2 = typeof re2 & {code: string}
;(re2 as Re2).code = 'require("ajv/dist/runtime/re2").default'

export default re2 as Re2
