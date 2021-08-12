const defaultRegExp = RegExp

//interface RegExpLike {
//    test: (s: string) => boolean
//}
//type RegExpEngine = (pattern: string, u: string) => RegExpLike
type RegExpImport = RegExpConstructor & {code: string}
;(defaultRegExp as RegExpImport).code = 'require("ajv/dist/runtime/regexp").default' // TODO: change type

export default defaultRegExp as RegExpImport // TODO: change type
