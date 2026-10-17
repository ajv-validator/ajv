import _Ajv from "../ajv"
import standaloneCode from "../../dist/standalone"
import * as requireFromString from "require-from-string"
import * as assert from "assert"
import {stringify} from "../../dist/compile/codegen"

// Values embedded in generated code are serialized as JSON, and a "__proto__" key in an
// object literal sets the prototype instead of creating an own property.
describe('"__proto__" keys in values embedded in generated code', () => {
  const protoData = () => JSON.parse('{"__proto__": 1}')

  describe("standalone code", () => {
    function standalone(schemaJson: string): any {
      const ajv = new _Ajv({code: {source: true}})
      return requireFromString(standaloneCode(ajv, ajv.compile(JSON.parse(schemaJson))))
    }

    it("should support const", () => {
      const validate = standalone('{"const": {"__proto__": 1}}')
      assert.strictEqual(validate(protoData()), true)
      assert.strictEqual(validate({}), false)
    })

    it("should support enum", () => {
      const validate = standalone('{"enum": [{"__proto__": 1}]}')
      assert.strictEqual(validate(protoData()), true)
      assert.strictEqual(validate({}), false)
    })

    it("should support __proto__ in properties with additionalProperties", () => {
      const props = Array.from({length: 9}, (_, i) => `"p${i}": {}`).join(",")
      const validate = standalone(
        `{"properties": {"__proto__": {}, ${props}}, "additionalProperties": false}`
      )
      assert.strictEqual(validate(protoData()), true)
    })
  })

  it("should assign defaults with __proto__ key as own property", () => {
    for (const source of [false, true]) {
      const ajv = new _Ajv({useDefaults: true, code: {source}})
      const validate = ajv.compile(
        JSON.parse('{"properties": {"foo": {"default": {"__proto__": {"bar": 1}}}}}')
      )
      const data: any = {}
      assert.strictEqual(validate(data), true)
      assert.deepStrictEqual(Object.keys(data.foo), ["__proto__"])
      assert.strictEqual(Object.getPrototypeOf(data.foo), Object.prototype)
      assert.strictEqual(data.foo.bar, undefined)
    }
  })

  it("should serialize values without __proto__ keys as literals", () => {
    const values = [{a: '"__proto__":', b: ['{"__proto__":1}', ',"__proto__":']}, ["__proto__"], 1]
    for (const x of values) assert.strictEqual(stringify(x).toString(), JSON.stringify(x))
    const withProto = JSON.parse('[{"a": {"__proto__": 1}}]')
    const code = stringify(withProto).toString()
    assert.strictEqual(code.startsWith("JSON.parse("), true)
    assert.deepStrictEqual(Object.keys(new Function(`return ${code}`)()[0].a), ["__proto__"])
  })
})
