import type AjvJTD from "../dist/jtd"

const m = typeof window == "object" ? (window as any).ajvJTD : require("" + "../dist/jtd")
const AjvClass: typeof AjvJTD = m.default

export default AjvClass
