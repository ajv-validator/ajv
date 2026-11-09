import Ajv2020 from "../ajv2020"
import Ajv7 from "../ajv"
import * as assert from "assert"

describe("contains is skipped when tuple items/prefixItems sees array shorter than tuple (issue #2698)", () => {
  it("should validate contains when array is shorter than prefixItems (draft2020)", () => {
    const ajv = new Ajv2020({strictTuples: false})
    const schema = {
      type: "array",
      prefixItems: [{type: "string"}],
      contains: {const: "admin"},
    }
    const validate = ajv.compile(schema)

    assert.strictEqual(validate([]), false)
    assert(validate.errors)
    assert.strictEqual(validate.errors[0].keyword, "contains")

    assert.strictEqual(validate(["admin"]), true)
    assert.strictEqual(validate([123]), false)
    assert(validate.errors)
    assert.strictEqual(validate.errors[0].keyword, "type")
  })

  it("should validate contains when array is shorter than tuple items (draft7)", () => {
    const ajv = new Ajv7({strictTuples: false})
    const schema = {
      type: "array",
      items: [true, {type: "number"}],
      contains: {const: "admin"},
    }
    const validate = ajv.compile(schema)

    assert.strictEqual(validate(["user"]), false)
    assert(validate.errors)
    assert.strictEqual(validate.errors[0].keyword, "contains")

    assert.strictEqual(validate(["user", 42, "admin"]), true)
    assert.strictEqual(validate(["user", "not-a-number"]), false)
    assert(validate.errors)
    assert.strictEqual(validate.errors[0].keyword, "type")
  })
})
