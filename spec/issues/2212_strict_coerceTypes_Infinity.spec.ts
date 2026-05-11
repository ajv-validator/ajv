import _Ajv from "../ajv"
import * as assert from "assert"

describe("string Infinity/-Infinity should be invalid when `strict: true, coerceTypes: \"array\"` (issue #2212)", () => {
  const ajv = new _Ajv({ strict: true, coerceTypes: 'array' })

  const schema = {
    type: "integer",
  }

  const validate = ajv.compile(schema)

  it("typed integer valid", () => assert.strictEqual(validate(42), true))
  it("typed NaN invalid", () => assert.strictEqual(validate(NaN), false))
  it("typed Infinity invalid", () => assert.strictEqual(validate(Infinity), false))
  it("typed -Infinity invalid", () => assert.strictEqual(validate(-Infinity), false))
  it("typed 9e600 invalid", () => assert.strictEqual(validate(9e600), false))
  it("typed -9E600 invalid", () => assert.strictEqual(validate(-9E600), false))

  it("string integer valid", () => assert.strictEqual(validate("42"), true))
  it("string NaN invalid", () => assert.strictEqual(validate("NaN"), false))
  it("string Infinity invalid", () => assert.strictEqual(validate("Infinity"), false))
  it("string -Infinity invalid", () => assert.strictEqual(validate("-Infinity"), false))
  it("string 9e600 invalid", () => assert.strictEqual(validate("9e600"), false))
  it("string -9E600 invalid", () => assert.strictEqual(validate("-9E600"), false))
})
