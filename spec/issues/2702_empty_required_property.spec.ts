import _Ajv2019 from "../ajv2019"
import _Ajv2020 from "../ajv2020"
import * as assert from "assert"

describe("empty string in required properties (issue #2702)", () => {
  for (const [name, Ajv] of [
    ["draft 2019-09", _Ajv2019],
    ["draft 2020-12", _Ajv2020],
  ] as const) {
    describe(name, () => {
      const ajv = new Ajv({strict: false})

      it("reports an empty required property", () => {
        const validate = ajv.compile({required: [""]})
        assert.strictEqual(validate({}), false)
        assert.strictEqual(validate({"": 1}), true)
      })

      it("reports an empty property after a non-empty one", () => {
        const validate = ajv.compile({required: ["a", ""]})
        assert.strictEqual(validate({a: 1}), false)
        assert.strictEqual(validate({a: 1, "": 1}), true)
      })

      it("reports an empty dependent required property", () => {
        const validate = ajv.compile({dependentRequired: {a: [""]}})
        assert.strictEqual(validate({a: 1}), false)
        assert.strictEqual(validate({a: 1, "": 1}), true)
      })
    })
  }
})
