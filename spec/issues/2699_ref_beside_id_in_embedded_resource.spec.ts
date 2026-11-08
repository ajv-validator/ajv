import _Ajv2020 from "../ajv2020"
import _Ajv from "../ajv"
import * as assert from "assert"

describe("$ref beside $id in an embedded resource (issue #2699)", () => {
  const x = {x: {type: "number"}}

  function test(schema: Record<string, unknown>): void {
    const validate = new _Ajv2020().compile(schema)
    assert.strictEqual(validate(1), true)
    assert.strictEqual(validate("a"), false)
  }

  it("should resolve the resource's $ref against its own $id", () => {
    test({$defs: {r: {$id: "r.json", $ref: "#/$defs/x", $defs: x}}, $ref: "#/$defs/r"})
  })

  it("should resolve the resource when referred to by its $id", () => {
    test({$defs: {r: {$id: "r.json", $ref: "#/$defs/x", $defs: x}}, $ref: "r.json"})
  })

  it("should resolve a $ref naming the resource's own $id", () => {
    test({$defs: {r: {$id: "r.json", $ref: "r.json#/$defs/x", $defs: x}}, $ref: "r.json"})
  })

  it("should resolve with absolute ids", () => {
    test({
      $id: "https://example.com/root.json",
      $defs: {r: {$id: "https://example.com/r.json", $ref: "#/$defs/x", $defs: x}},
      $ref: "r.json",
    })
  })

  it("should not resolve the resource's $ref against the root", () => {
    test({
      $defs: {
        r: {$id: "r.json", $ref: "#/$defs/y", $defs: {y: {type: "number"}}},
        y: {type: "string"},
      },
      $ref: "r.json",
    })
  })

  it("should resolve as at the root with draft-07", () => {
    // Ajv already resolves a root's $ref against the $id beside it in draft-07
    for (const schema of [
      {$id: "r.json", $ref: "#/definitions/x", definitions: x},
      {definitions: {r: {$id: "r.json", $ref: "#/definitions/x", definitions: x}}, $ref: "r.json"},
    ]) {
      const validate = new _Ajv().compile(schema)
      assert.strictEqual(validate(1), true)
      assert.strictEqual(validate("a"), false)
    }
  })
})
