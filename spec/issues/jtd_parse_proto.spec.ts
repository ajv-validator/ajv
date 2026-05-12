import _AjvJTD from "../ajv_jtd"
import chai from "../chai"
const {expect} = chai

describe("JTD compileParser with __proto__ key in JSON data", () => {
  it("should not replace object prototype with values schema", () => {
    const ajv = new _AjvJTD()
    const parse = ajv.compileParser({values: {}})
    const data = parse('{"__proto__": {"injected": true}, "name": "Alice"}') as Record<
      string,
      unknown
    >
    expect(data).to.have.own.property("name")
    expect(data.injected).to.equal(undefined)
    expect("injected" in data).to.equal(false)
  })

  it("should not replace object prototype with additionalProperties", () => {
    const ajv = new _AjvJTD()
    const parse = ajv.compileParser({
      properties: {name: {type: "string"}},
      additionalProperties: true,
    })
    const data = parse('{"name": "Alice", "__proto__": {"injected": true}}') as Record<
      string,
      unknown
    >
    expect(data).to.have.own.property("name")
    expect(data.injected).to.equal(undefined)
    expect("injected" in data).to.equal(false)
  })
})
