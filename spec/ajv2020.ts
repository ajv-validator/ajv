import type Ajv2020 from "../dist/2019"
const AjvClass: typeof Ajv2020 =
  typeof window == "object" ? (window as any).ajv2020 : require("" + "../dist/2020")

export default AjvClass
module.exports = AjvClass
module.exports.default = AjvClass
