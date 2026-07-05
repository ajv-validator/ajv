import _Ajv from "../ajv"
import _Ajv2020 from "../ajv2020"
import type Ajv from "ajv"
import * as assert from "assert"

describe("large oneOf does not overflow the call stack (issue #2641)", () => {
  const N = 3000

  function makeSchema(n: number): object {
    return {
      oneOf: Array.from({length: n}, (_, i) => ({
        type: "object",
        required: ["name"],
        properties: {name: {const: `variant_${i}`}},
      })),
    }
  }

  let ajv: Ajv
  before(() => {
    ajv = new _Ajv({strict: false})
  })

  it(`should compile a oneOf with ${N} variants without throwing`, function () {
    this.timeout(10000)
    assert.doesNotThrow(() => ajv.compile(makeSchema(N)))
  })

  it(`should validate against a oneOf with ${N} variants without RangeError`, function () {
    this.timeout(10000)
    const validate = ajv.compile(makeSchema(N))
    // matches exactly one variant
    assert.strictEqual(validate({name: "variant_0"}), true)
    assert.strictEqual(validate({name: `variant_${N - 1}`}), true)
    // matches zero variants
    assert.strictEqual(validate({name: "missing"}), false)
    assert.strictEqual(validate({}), false)
  })

  it("should keep oneOf semantics for a matching / failing input", () => {
    const validate = ajv.compile({
      oneOf: [
        {type: "object", properties: {a: {const: 1}}, required: ["a"]},
        {type: "object", properties: {b: {const: 2}}, required: ["b"]},
        {type: "object", properties: {c: {const: 3}}, required: ["c"]},
      ],
    })
    assert.strictEqual(validate({a: 1}), true)
    assert.strictEqual(validate({a: 1, b: 2}), false)
    assert.strictEqual(validate({a: 1, b: 2, c: 3}), false)
    assert.strictEqual(validate({}), false)
  })

  it("should report the conflicting pair in passingSchemas when several match", () => {
    const validate = ajv.compile({
      oneOf: [
        {type: "object", properties: {a: {const: 1}}, required: ["a"]},
        {type: "object", properties: {b: {const: 2}}, required: ["b"]},
        {type: "object", properties: {c: {const: 3}}, required: ["c"]},
      ],
    })
    validate({a: 1, b: 2, c: 3})
    const err = (validate.errors || []).find((e) => e.keyword === "oneOf")
    assert.deepStrictEqual(err?.params, {passingSchemas: [0, 1]})
  })
})

describe("flat oneOf keeps unevaluatedProperties on conflict (issue #2641)", () => {
  // The flattened oneOf codegen must only merge evaluated properties for the
  // first matching variant. A conflict-causing later match must not mark its
  // properties as evaluated, otherwise a legitimate unevaluatedProperties error
  // is swallowed. Stock ajv reports both the oneOf conflict and the
  // unevaluatedProperties error; the fix must match that behaviour.
  const ajv = new _Ajv2020({allErrors: true})

  it("reports unevaluatedProperties for the conflicting variant (2-way)", () => {
    const validate = ajv.compile({
      type: "object",
      oneOf: [
        {required: ["a"], properties: {a: {}}},
        {required: ["b"], properties: {b: {}}},
      ],
      unevaluatedProperties: false,
    })
    assert.strictEqual(validate({a: 1, b: 1}), false)
    const errors = validate.errors || []
    assert.strictEqual(errors.length, 2)
    const oneOfErr = errors.find((e) => e.keyword === "oneOf")
    assert.deepStrictEqual(oneOfErr?.params, {passingSchemas: [0, 1]})
    const unevalErr = errors.find((e) => e.keyword === "unevaluatedProperties")
    assert.deepStrictEqual(unevalErr?.params, {unevaluatedProperty: "b"})
  })

  it("reports unevaluatedProperties for every non-first match (3-way)", () => {
    const validate = ajv.compile({
      type: "object",
      oneOf: [
        {required: ["a"], properties: {a: {}}},
        {required: ["b"], properties: {b: {}}},
        {required: ["c"], properties: {c: {}}},
      ],
      unevaluatedProperties: false,
    })
    assert.strictEqual(validate({a: 1, b: 1, c: 1}), false)
    const errors = validate.errors || []
    assert.strictEqual(errors.length, 3)
    const oneOfErr = errors.find((e) => e.keyword === "oneOf")
    assert.deepStrictEqual(oneOfErr?.params, {passingSchemas: [0, 1]})
    const uneval = errors
      .filter((e) => e.keyword === "unevaluatedProperties")
      .map((e) => (e.params as {unevaluatedProperty: string}).unevaluatedProperty)
      .sort()
    assert.deepStrictEqual(uneval, ["b", "c"])
  })
})
