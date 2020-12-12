import type Ajv from "../dist/core"

const AjvClass: typeof Ajv = typeof window == "object" ? (window as any).Ajv : require("" + "..")

export default AjvClass

module.exports = AjvClass
