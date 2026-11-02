import AjvJTD from "../../dist/jtd"
import * as assert from "assert"

describe("JTD serialization of lone UTF-16 surrogates", () => {
  const ajv = new AjvJTD()
  const serialize = ajv.compileSerializer({type: "string"})

  for (const value of ["\ud800", "\udfff", "a\ud800b", "\ud800\ud800\udc00", "\udc00\ud800"]) {
    it(`preserves ${JSON.stringify(value)} through UTF-8`, () => {
      const json = serialize(value)
      assert.strictEqual(json, JSON.stringify(value))
      assert.strictEqual(JSON.parse(Buffer.from(json, "utf8").toString("utf8")), value)
    })
  }

  it("keeps valid surrogate pairs unchanged", () => {
    const value = "hello \ud83d\ude00"
    assert.strictEqual(serialize(value), JSON.stringify(value))
  })

  it("preserves existing escaping alongside lone surrogates", () => {
    const json = serialize('"\ud800\u2028\udc00\\')
    assert.strictEqual(json, '"\\"\\ud800\\u2028\\udc00\\\\"')
    assert.strictEqual(JSON.parse(json), '"\ud800\u2028\udc00\\')
  })
})
