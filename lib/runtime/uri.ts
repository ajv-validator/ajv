import * as uri from "fast-uri"

type URI = typeof uri & {code: string; import: readonly [string, string]}
;(uri as URI).code = 'require("ajv/dist/runtime/uri").default'
;(uri as URI).import = ["uri", "ajv/dist/runtime/uri"]

const asUri: URI = uri as URI

export default uri as URI
export {asUri as uri}
