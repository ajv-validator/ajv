import type Ajv from "../dist/core"
import type {AnyValidateFunction} from "../dist/core"
import _Ajv from "./ajv"
import _Ajv2019 from "./ajv2019"
import _Ajv2020 from "./ajv2020"
import standaloneCode from "../dist/standalone"
import * as requireFromString from "require-from-string"
import * as assert from "assert"

// additionalProperties uses different membership checks depending on the number of
// properties (comparisons or hasOwnProperty) - these tests cover
// the sizes around the thresholds and the property names that could break any of them.
const SIZES = [3, 8, 9, 12, 13, 40]
const SPECIAL = [
  "constructor",
  "toString",
  "hasOwnProperty",
  "valueOf",
  "",
  "0",
  "a'b",
  'a"b\n\u2028',
]

function propNames(n: number): string[] {
  const names = SPECIAL.slice(0, Math.min(n, SPECIAL.length))
  for (let i = names.length; i < n; i++) names.push(`prop${i}`)
  return names
}

function objectSchema(names: string[], additionalProperties: any = false): any {
  const properties: Record<string, any> = {}
  for (const p of names) properties[p] = {not: {type: "number"}}
  return {type: "object", properties, additionalProperties}
}

function objectWith(names: string[]): Record<string, string> {
  const data: Record<string, string> = {}
  for (const p of names) data[p] = "x"
  return data
}

interface Variant {
  name: string
  ajv: () => Ajv
  standalone?: boolean
}

const VARIANTS: Variant[] = [
  {name: "default", ajv: () => new _Ajv()},
  {name: "allErrors", ajv: () => new _Ajv({allErrors: true})},
  {name: "es5", ajv: () => new _Ajv({code: {es5: true}})},
  {name: "draft2019", ajv: () => new _Ajv2019()},
  {name: "draft2020", ajv: () => new _Ajv2020({allErrors: true})},
  {name: "standalone", ajv: () => new _Ajv({code: {source: true}}), standalone: true},
]

function compile(variant: Variant, schema: any): AnyValidateFunction {
  const ajv = variant.ajv()
  const validate = ajv.compile(schema)
  if (!variant.standalone) return validate
  return requireFromString(standaloneCode(ajv, validate))
}

describe("additionalProperties with different numbers of properties", () => {
  for (const variant of VARIANTS) {
    describe(variant.name, () => {
      for (const n of SIZES) {
        describe(`${n} properties`, () => {
          const names = propNames(n)

          it("should allow defined properties in any order", () => {
            const validate = compile(variant, objectSchema(names))
            assert.strictEqual(validate({}), true)
            assert.strictEqual(validate(objectWith(names)), true)
            assert.strictEqual(validate(objectWith([...names].reverse())), true)
            assert.strictEqual(validate(objectWith(names.slice(-2))), true)
            assert.strictEqual(validate(JSON.parse(JSON.stringify(objectWith(names)))), true)
          })

          it("should report additional properties", () => {
            const validate = compile(variant, objectSchema(names))
            const extra = ["__proto__", "prop", `prop${n}`, "Constructor", "toString ", "1"]
            for (const p of extra) {
              // JSON.parse creates own "__proto__" property
              const json = `{${JSON.stringify(names[n - 1])}: "x", ${JSON.stringify(p)}: 1}`
              assert.strictEqual(validate(JSON.parse(json)), false, `"${p}" should be additional`)
              assert.deepStrictEqual(validate.errors?.[0]?.params, {additionalProperty: p})
            }
          })

          it("should report inherited enumerable properties that are not defined", () => {
            const validate = compile(variant, objectSchema(names))
            const proto = {unknownInherited: "x"}
            const data = Object.assign(Object.create(proto), objectWith(names))
            assert.strictEqual(validate(data), false)
            assert.deepStrictEqual(validate.errors?.[0]?.params, {
              additionalProperty: "unknownInherited",
            })
            const allowed = Object.assign(Object.create({[names[0]]: "x"}), objectWith(names))
            assert.strictEqual(validate(allowed), true)
          })

          const itAllErrors = variant.ajv().opts.allErrors ? it : it.skip
          itAllErrors("should report all additional properties in order with allErrors", () => {
            const validate = compile(variant, objectSchema(names))
            const data = {extra1: 1, ...objectWith(names), extra2: 2, extra3: 3}
            assert.strictEqual(validate(data), false)
            assert.deepStrictEqual(validate.errors?.map((e) => e.params.additionalProperty), [
              "extra1",
              "extra2",
              "extra3",
            ])
          })

          it("should validate additional properties with schema", () => {
            const validate = compile(variant, objectSchema(names, {type: "number"}))
            assert.strictEqual(validate({...objectWith(names), extra: 1}), true)
            assert.strictEqual(validate({...objectWith(names), extra: "1"}), false)
            assert.strictEqual(validate.errors?.[0]?.instancePath, "/extra")
          })

          it("should combine with patternProperties", () => {
            const schema = objectSchema(names)
            schema.patternProperties = {"^x-": {type: "number"}}
            const validate = compile(variant, schema)
            assert.strictEqual(validate({...objectWith(names), "x-a": 1}), true)
            assert.strictEqual(validate({...objectWith(names), "x-a": "1"}), false)
            assert.strictEqual(validate({...objectWith(names), "y-a": 1}), false)
          })

          it("should validate nested objects", () => {
            const schema = objectSchema(names)
            schema.properties[names[n - 1]] = objectSchema(names)
            const validate = compile(variant, schema)
            const data: any = {...objectWith(names), [names[n - 1]]: objectWith(names)}
            assert.strictEqual(validate(data), true)
            data[names[n - 1]].extra = "x"
            assert.strictEqual(validate(data), false)
            assert.deepStrictEqual(validate.errors?.[0]?.params, {additionalProperty: "extra"})
          })
        })
      }
    })
  }

  describe("schema with own __proto__ property", () => {
    // more than 8 properties: "__proto__" defined in the schema is allowed in data
    // (standalone code loses own "__proto__" keys of schema objects, it is tested separately)
    for (const n of [9, 12, 13, 40]) {
      for (const variant of VARIANTS.filter((v) => !v.standalone)) {
        it(`should allow it with ${n} properties (${variant.name})`, () => {
          const schema = JSON.parse(JSON.stringify(objectSchema(propNames(n))))
          schema.properties = JSON.parse(
            JSON.stringify(schema.properties).replace(/^{/, '{"__proto__":{"type":"string"},')
          )
          const validate = compile(variant, schema)
          assert.strictEqual(validate(JSON.parse('{"__proto__": "x"}')), true)
          assert.strictEqual(validate(JSON.parse('{"__proto__": "x", "extra": 1}')), false)
        })
      }
    }
  })

  describe("removeAdditional option", () => {
    for (const n of SIZES) {
      const names = propNames(n)
      for (const removeAdditional of [true, "all", "failing"] as const) {
        it(`should remove additional properties with ${n} properties (${removeAdditional})`, () => {
          const ajv = new _Ajv({removeAdditional})
          const validate = ajv.compile(
            objectSchema(names, removeAdditional === "failing" ? {type: "number"} : false)
          )
          const data: any = {...objectWith(names), extra: "x", "x-y": "x"}
          assert.strictEqual(validate(data), true)
          assert.deepStrictEqual(data, objectWith(names))
        })
      }
    }
  })

  describe("generated code", () => {
    function membershipCode(n: number, opts = {}): string {
      const validate = new _Ajv({code: {source: true, ...opts}}).compile(objectSchema(propNames(n)))
      const src = validate.source?.validateCode as string
      return src.slice(src.search(/for\((const|var) key0 in data\)/))
    }

    it("should use comparisons for up to 12 properties", () => {
      assert.strictEqual(membershipCode(12).includes('key0 === "prop11"'), true)
    })

    it("should use hasOwnProperty for more than 12 properties", () => {
      assert.strictEqual(membershipCode(13).includes("key0 ==="), false)
    })
  })
})
