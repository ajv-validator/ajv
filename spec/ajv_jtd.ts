import type AjvJTD from "../dist/jtd"
const AjvClass: typeof AjvJTD =
  typeof window == "object" ? (window as any).ajvJTD : require("" + "../dist/jtd")

export default AjvClass
module.exports = AjvClass
module.exports.default = AjvClass
