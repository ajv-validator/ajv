import type Ajv from "../dist/core"
import type AjvJtd from "../dist/jtd"

const AjvClass: typeof Ajv = typeof window == "object" ? (window as any).ajv7 : require("" + "..")

export default AjvClass
module.exports = AjvClass
module.exports.default = AjvClass

export const AjvJtdClass: typeof AjvJtd =
  typeof window == "object" ? (window as any).ajvJTD : require("../dist/jtd")
module.exports.AjvJtdClass = AjvJtdClass
