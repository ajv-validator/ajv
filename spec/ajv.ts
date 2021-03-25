import type Ajv from "../dist/core"
const AjvClass: typeof Ajv = typeof window == "object" ? (window as any).ajv7 : require("" + "..")

export default AjvClass
module.exports = AjvClass
module.exports.default = AjvClass
