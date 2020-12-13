import type Ajv2019 from "../dist/2019"

const m = typeof window == "object" ? (window as any).ajv2019 : require("" + "../dist/2019")
const AjvClass: typeof Ajv2019 = m.default

export default AjvClass
