import type Ajv from "../dist/ajv"

const AjvClass: typeof Ajv =
  typeof window == "object" ? (window as any).Ajv : require("" + "../dist/ajv")

export default AjvClass

module.exports = AjvClass
