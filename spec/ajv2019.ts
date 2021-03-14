import type Ajv2019 from "../dist/2019"
const AjvClass: typeof Ajv2019 =
  typeof window == "object" ? (window as any).ajv2019 : require("" + "../dist/2019")

export default AjvClass
module.exports = AjvClass
module.exports.default = AjvClass
