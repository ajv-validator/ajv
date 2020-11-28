import type {AnyValidateFunction} from "../dist/core"
import _Ajv from "./ajv"
import standaloneCode from "../dist/standalone"
import requireFromString = require("require-from-string")
import assert = require("assert")

describe("standalone code generation", () => {
  it("should generate module code with multiple exports", () => {
    const ajv = new _Ajv({code: {source: true}})
    ajv.addSchema({
      $id: "https://example.com/number.json",
      type: "number",
      minimum: 0,
    })
    ajv.addSchema({
      $id: "https://example.com/string.json",
      type: "string",
      minLength: 2,
    })
    const moduleCode = standaloneCode(ajv, {
      validateNumber: "https://example.com/number.json",
      validateString: "https://example.com/string.json",
    })
    const {validateNumber, validateString} = requireFromString(moduleCode) as {
      [n: string]: AnyValidateFunction<unknown>
    }
    assert.strictEqual(validateNumber(1), true)
    assert.strictEqual(validateNumber(0), true)
    assert.strictEqual(validateNumber(-1), false)
    assert.strictEqual(validateNumber("1"), false)

    assert.strictEqual(validateString("123"), true)
    assert.strictEqual(validateString("12"), true)
    assert.strictEqual(validateString("1"), false)
    assert.strictEqual(validateString(12), false)
  })

  it("should generate module code with a single export (ESM compatible)", () => {
    const ajv = new _Ajv({code: {source: true}})
    const v = ajv.compile({
      type: "number",
      minimum: 0,
    })
    const moduleCode = standaloneCode(ajv, v)
    const validate = requireFromString(moduleCode) as AnyValidateFunction<unknown>
    assert.strictEqual(validate(1), true)
    assert.strictEqual(validate(0), true)
    assert.strictEqual(validate(-1), false)
    assert.strictEqual(validate("1"), false)

    const validate2 = requireFromString(moduleCode).default as AnyValidateFunction<unknown>
    assert.strictEqual(validate2(1), true)
    assert.strictEqual(validate2(0), true)
    assert.strictEqual(validate2(-1), false)
    assert.strictEqual(validate2("1"), false)
  })
})
