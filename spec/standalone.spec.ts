import type Ajv from "../dist/core"
import type {AnyValidateFunction} from "../dist/core"
import _Ajv from "./ajv"
import standaloneCode from "../dist/standalone"
import requireFromString = require("require-from-string")
import assert = require("assert")

describe("standalone code generation", () => {
  describe("multiple exports", () => {
    let ajv: Ajv
    const numSchema = {
      $id: "https://example.com/number.json",
      type: "number",
      minimum: 0,
    }
    const strSchema = {
      $id: "https://example.com/string.json",
      type: "string",
      minLength: 2,
    }

    describe("without schema keys", () => {
      beforeEach(() => {
        ajv = new _Ajv({code: {source: true}})
        ajv.addSchema(numSchema)
        ajv.addSchema(strSchema)
      })

      it("should generate module code with named exports", () => {
        const moduleCode = standaloneCode(ajv, {
          validateNumber: "https://example.com/number.json",
          validateString: "https://example.com/string.json",
        })
        const m = requireFromString(moduleCode)
        assert.strictEqual(Object.keys(m).length, 2)
        testExports(m)
      })

      it("should generate module code with all exports", () => {
        const moduleCode = standaloneCode(ajv)
        const m = requireFromString(moduleCode)
        assert.strictEqual(Object.keys(m).length, 2)
        testExports({
          validateNumber: m["https://example.com/number.json"],
          validateString: m["https://example.com/string.json"],
        })
      })
    })

    describe("with schema keys", () => {
      beforeEach(() => {
        ajv = new _Ajv({code: {source: true}})
        ajv.addSchema(numSchema, "validateNumber")
        ajv.addSchema(strSchema, "validateString")
      })

      it("should generate module code with named exports", () => {
        const moduleCode = standaloneCode(ajv, {
          validateNumber: "validateNumber",
          validateString: "validateString",
        })
        const m = requireFromString(moduleCode)
        assert.strictEqual(Object.keys(m).length, 2)
        testExports(m)
      })

      it("should generate module code with all exports", () => {
        const moduleCode = standaloneCode(ajv)
        const m = requireFromString(moduleCode)
        assert.strictEqual(Object.keys(m).length, 2)
        testExports(m)
      })
    })

    function testExports(m: {[n: string]: AnyValidateFunction<unknown>}) {
      assert.strictEqual(m.validateNumber(1), true)
      assert.strictEqual(m.validateNumber(0), true)
      assert.strictEqual(m.validateNumber(-1), false)
      assert.strictEqual(m.validateNumber("1"), false)

      assert.strictEqual(m.validateString("123"), true)
      assert.strictEqual(m.validateString("12"), true)
      assert.strictEqual(m.validateString("1"), false)
      assert.strictEqual(m.validateString(12), false)
    }
  })

  describe("two refs to the same schema (issue #1361)", () => {
    const userSchema = {
      $id: "user.json",
      type: "object",
      properties: {
        name: {type: "string"},
      },
      required: ["name"],
    }

    const infoSchema = {
      $id: "info.json",
      type: "object",
      properties: {
        author: {$ref: "user.json"},
        contributors: {
          type: "array",
          items: {$ref: "user.json"},
        },
      },
      required: ["author", "contributors"],
    }

    describe("all exports", () => {
      it("should not have duplicate functions", () => {
        const ajv = new _Ajv({
          allErrors: true,
          code: {optimize: false, source: true},
          inlineRefs: false, // it is needed to show the issue, schemas with refs won't be inlined anyway
          schemas: [userSchema, infoSchema],
        })

        const moduleCode = standaloneCode(ajv)
        assertNoDuplicateFunctions(moduleCode)
        const {"user.json": user, "info.json": info} = requireFromString(moduleCode)
        testExports({user, info})
      })
    })

    describe("named exports", () => {
      it("should not have duplicate functions", () => {
        const ajv = new _Ajv({
          allErrors: true,
          code: {optimize: false, source: true},
          inlineRefs: false, // it is needed to show the issue, schemas with refs won't be inlined anyway
          schemas: [userSchema, infoSchema],
        })

        const moduleCode = standaloneCode(ajv, {user: "user.json", info: "info.json"})
        assertNoDuplicateFunctions(moduleCode)
        testExports(requireFromString(moduleCode))
      })
    })

    function assertNoDuplicateFunctions(code: string): void {
      const funcs = code.match(/function\s+([a-z0-9_$]+)/gi)
      assert(Array.isArray(funcs))
      assert(funcs.length > 0)
      assert.strictEqual(funcs.length, new Set(funcs).size, "should have no duplicates")
    }

    function testExports(validate: {[n: string]: AnyValidateFunction<unknown>}): void {
      assert.strictEqual(validate.user({}), false)
      assert.strictEqual(validate.user({name: "usr1"}), true)

      assert.strictEqual(validate.info({}), false)
      assert.strictEqual(
        validate.info({
          author: {name: "usr1"},
          contributors: [{name: "usr2"}],
        }),
        true
      )
    }
  })

  it("should generate module code with a single export (ESM compatible)", () => {
    const ajv = new _Ajv({code: {source: true}})
    const v = ajv.compile({
      type: "number",
      minimum: 0,
    })
    const moduleCode = standaloneCode(ajv, v)
    const m = requireFromString(moduleCode)
    testExport(m)
    testExport(m.default)

    function testExport(validate: AnyValidateFunction<unknown>) {
      assert.strictEqual(validate(1), true)
      assert.strictEqual(validate(0), true)
      assert.strictEqual(validate(-1), false)
      assert.strictEqual(validate("1"), false)
    }
  })
})
