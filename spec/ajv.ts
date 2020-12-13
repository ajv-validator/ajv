import type Ajv from "../dist/core"

const m = typeof window == "object" ? (window as any).ajv7 : require("" + "..")
const AjvClass: typeof Ajv = m.default

export default AjvClass
