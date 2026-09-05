import Ajv2020 from "../dist/2020"
import Ajv2019 from "../dist/2019"
import Ajv from "../dist/ajv"
import type AjvCore from "../dist/core"
import type {Options} from "../dist/core"
import type {AnySchema, ValidateFunction, AsyncValidateFunction} from "../dist/types"
import standalone from "../dist/standalone"
import * as fromString from "require-from-string"
import * as assert from "assert"

interface TestGroup {
  description: string
  schema: AnySchema
  tests: {description: string; data: unknown; valid: boolean}[]
}

const dynamic: TestGroup[] = [
  ...require("./JSON-Schema-Test-Suite/tests/draft2020-12/dynamicRef.json"),
  ...require("./fixtures/full-dynamic-refs/dynamicRef-extra.json"),
]
const recursive: TestGroup[] = [
  ...require("./JSON-Schema-Test-Suite/tests/draft2019-09/recursiveRef.json"),
  ...require("./fixtures/full-dynamic-refs/recursiveRef-extra.json"),
]
const remotes = {
  ...require("./fixtures/full-dynamic-refs/remotes.json"),
  "http://localhost:1234/tree.json": require("./JSON-Schema-Test-Suite/remotes/tree.json"),
  "http://localhost:1234/extendible-dynamic-ref.json": require("./JSON-Schema-Test-Suite/remotes/extendible-dynamic-ref.json"),
}
const isBrowser = typeof window === "object"
const itStandalone = isBrowser ? it.skip : it
const minimal = {
  type: "object",
  properties: {schema: {$dynamicRef: "#meta"}},
  unevaluatedProperties: false,
  $defs: {schema: {$dynamicAnchor: "meta", type: ["object", "boolean"]}},
}
const generic = {
  $id: "https://example.com/generic",
  $defs: {
    binding: {$dynamicAnchor: "item", type: "string"},
    template: {
      $id: "template",
      type: "array",
      items: {$dynamicRef: "#item"},
      $defs: {fallback: {$dynamicAnchor: "item", not: {}}},
    },
  },
  $ref: "template",
}
const options: Options = {
  fullDynamicRefs: true,
  strict: false,
  validateFormats: false,
  code: {source: true},
}

function validators(ajv: AjvCore, schema: AnySchema): ValidateFunction[] {
  const validate = ajv.compile(schema)
  return isBrowser ? [validate] : [validate, fromString(standalone(ajv, validate))]
}

describe("fullDynamicRefs", () => {
  for (const allErrors of [false, true]) {
    for (const inlineRefs of [true, false, 1, 100]) {
      for (const es5 of [false, true]) {
        for (const optimize of [false, true]) {
          const settings = {...options, allErrors, inlineRefs, code: {source: true, es5, optimize}}
          describe(JSON.stringify({allErrors, inlineRefs, es5, optimize}), () => {
            for (const [Constructor, groups] of [
              [Ajv2020, dynamic],
              [Ajv2019, recursive],
            ] as const) {
              for (const group of groups) {
                it(group.description, () => {
                  const ajv = new Constructor(settings)
                  if (Constructor === Ajv2020) {
                    for (const uri of Object.keys(remotes)) ajv.addSchema(remotes[uri], uri)
                  }
                  for (const validate of validators(ajv, group.schema)) {
                    for (const test of group.tests) {
                      assert.strictEqual(validate(test.data), test.valid, test.description)
                    }
                  }
                })
              }
            }

            it("resolves unvisited anchors with or without an absolute ID", () => {
              for (const $id of [undefined, "https://example.com/minimal"]) {
                const ajv = new Ajv2020(settings)
                for (const validate of validators(ajv, {...minimal, $id})) {
                  assert.strictEqual(validate({schema: {type: "string"}}), true)
                  assert.strictEqual(validate({schema: false}), true)
                  assert.strictEqual(validate({schema: 42}), false)
                  assert.strictEqual(validate({schema: {}, extra: true}), false)
                }
              }
            })

            it("registers generic bindings before visiting their declarations", () => {
              for (const $id of [undefined, generic.$id]) {
                for (const validate of validators(new Ajv2020(settings), {...generic, $id})) {
                  assert.strictEqual(validate(["ok"]), true)
                  assert.strictEqual(validate([42]), false)
                  assert.strictEqual(validate(["again"]), true)
                }
              }
            })
          })
        }
      }
    }
  }

  it("retains legacy behavior and code when disabled or omitted", () => {
    const omitted = new Ajv2020({strict: false, code: {source: true}})
    const disabled = new Ajv2020({strict: false, code: {source: true}, fullDynamicRefs: false})
    const first = omitted.compile(minimal)
    const second = disabled.compile(minimal)
    assert.strictEqual(first({schema: false}), false)
    assert.strictEqual(second({schema: false}), false)
    assert.strictEqual(standalone(omitted, first), standalone(disabled, second))
  })

  it("keeps fullDynamicRefs inert without dynamicRef", () => {
    const schema = {$defs: {value: {type: "string"}}, $ref: "#/$defs/value"}
    const legacy = new Ajv({code: {source: true}})
    const enabled = new Ajv({code: {source: true}, fullDynamicRefs: true})
    assert.strictEqual(enabled.opts.fullDynamicRefs, false)
    assert.strictEqual(
      standalone(legacy, legacy.compile(schema)),
      standalone(enabled, enabled.compile(schema))
    )
  })

  it("supports meta-schema registration and lookup", () => {
    const ajv = new Ajv2020(options)
    ajv.addMetaSchema(minimal, "https://example.com/meta")
    const validate = ajv.getSchema("https://example.com/meta")!
    assert.strictEqual(validate({schema: false}), true)
    assert.strictEqual(validate({schema: 42}), false)
    if (!isBrowser) assert.strictEqual(fromString(standalone(ajv, validate))({schema: false}), true)
  })

  itStandalone("keeps dynamic scopes independent across standalone exports", () => {
    const ajv = new Ajv2020(options)
    const stringId = "https://example.com/strings"
    const numberId = "https://example.com/numbers"
    ajv.addSchema({$id: stringId, $dynamicAnchor: "item", type: "string"})
    ajv.addSchema({$id: numberId, $dynamicAnchor: "item", type: "number"})
    ajv.addSchema({
      $id: "https://example.com/string-list",
      type: "array",
      items: {$dynamicRef: `${stringId}#item`},
    })
    ajv.addSchema({
      $id: "https://example.com/number-list",
      type: "array",
      items: {$dynamicRef: `${numberId}#item`},
    })
    const exported = fromString(
      standalone(ajv, {
        strings: "https://example.com/string-list",
        numbers: "https://example.com/number-list",
      })
    )
    for (let repeat = 0; repeat < 2; repeat++) {
      assert.strictEqual(exported.strings(["ok"]), true)
      assert.strictEqual(exported.strings([42]), false)
      assert.strictEqual(exported.numbers([42]), true)
      assert.strictEqual(exported.numbers(["ok"]), false)
    }
  })

  it("reuses an anonymous root validator for its own anchor", () => {
    const ajv = new Ajv2020(options)
    const validate = ajv.compile({
      $dynamicAnchor: "node",
      type: "object",
      properties: {child: {$dynamicRef: "#node"}},
    })
    assert.strictEqual(validate({child: {}}), true)
    assert.strictEqual(validate({child: 42}), false)
    const code = standalone(ajv, validate)
    assert.strictEqual((code.match(/function validate/g) || []).length, 1)
  })

  it("compiles an anchor once across pointer and anchor references", () => {
    for (const inlineRefs of [true, false, 1, 100]) {
      let compilations = 0
      const ajv = new Ajv2020({...options, inlineRefs})
      ajv.addKeyword({
        keyword: "countCompilation",
        code() {
          compilations++
        },
      })
      const schema = {
        $id: "https://example.com/shared-anchor",
        $defs: {node: {$dynamicAnchor: "node", type: "string", countCompilation: true}},
        type: "object",
        properties: {
          pointer: {$ref: "#/$defs/node"},
          dynamic: {$dynamicRef: "#node"},
          anchor: {$ref: "#node"},
        },
      }
      for (const validate of validators(ajv, schema)) {
        assert.strictEqual(validate({pointer: "a", dynamic: "b", anchor: "c"}), true)
        for (const property of ["pointer", "dynamic", "anchor"]) {
          assert.strictEqual(validate({[property]: 42}), false)
        }
      }
      assert.strictEqual(compilations, 1)
      const pointer = ajv.getSchema("https://example.com/shared-anchor#/$defs/node")!
      const anchor = ajv.getSchema("https://example.com/shared-anchor#node")!
      assert.strictEqual(pointer, anchor)
      assert.strictEqual(pointer("ok"), true)
      assert.strictEqual(pointer(42), false)
      assert.strictEqual(compilations, 1)
      assert.strictEqual(
        (standalone(ajv, ajv.compile(schema)).match(/function validate/g) || []).length,
        2
      )
    }
  })

  it("does not let forced dynamic compilation change plain reference inlining", () => {
    for (const dynamicFirst of [false, true]) {
      const ajv = new Ajv2020(options)
      const plain = {plain: {$ref: "#/$defs/value"}}
      const dynamicProperty = {dynamic: {$dynamicRef: "#/$defs/value"}}
      const validate = ajv.compile({
        type: "object",
        $defs: {value: {type: "string"}},
        properties: dynamicFirst ? {...dynamicProperty, ...plain} : {...plain, ...dynamicProperty},
      })
      const source = validate.source!.validateCode
      assert.ok(source.includes('typeof data.plain !== "string"'))
      assert.strictEqual(validate({plain: "ok", dynamic: "ok"}), true)
      assert.strictEqual(validate({plain: 42, dynamic: "ok"}), false)
    }
  })

  it("merges evaluated properties from the runtime-selected anchor", () => {
    const schema = {
      $defs: {
        extension: {$dynamicAnchor: "ext", properties: {extra: {type: "string"}}},
        base: {
          $id: "https://example.com/evaluated-base",
          $defs: {extension: {$dynamicAnchor: "ext", properties: {base: true}}},
          allOf: [{$dynamicRef: "#ext"}],
          unevaluatedProperties: false,
        },
      },
      $ref: "https://example.com/evaluated-base",
    }
    for (const allErrors of [false, true]) {
      for (const validate of validators(new Ajv2020({...options, allErrors}), schema)) {
        assert.strictEqual(validate({extra: "ok"}), true)
        assert.strictEqual(validate({extra: "ok", stray: true}), false)
        assert.strictEqual(validate({base: true}), false)
        assert.strictEqual(validate({extra: "again"}), true)
      }
    }
  })

  it("allows async callers to use synchronous dynamic targets", async () => {
    for (const useAnchor of [false, true]) {
      const schema = {
        $async: true,
        $defs: {item: {$dynamicAnchor: "item", type: "string"}},
        $dynamicRef: useAnchor ? "#item" : "#/$defs/item",
      }
      for (const validate of validators(new Ajv2020(options), schema)) {
        const asyncValidate = validate as unknown as AsyncValidateFunction
        assert.strictEqual(await asyncValidate("ok"), "ok")
        let error: any
        try {
          await asyncValidate(42)
        } catch (e) {
          error = e
        }
        assert.ok(error)
        assert.strictEqual(error.errors[0].keyword, "type")
      }
    }
  })

  it("keeps anonymous registrations and repeated compilation independent", () => {
    const ajv = new Ajv2020(options)
    const schema = {...minimal}
    const first = ajv.compile(schema)
    assert.strictEqual(first, ajv.compile(schema))
    const second = ajv.compile({
      ...minimal,
      $defs: {schema: {$dynamicAnchor: "meta", type: "number"}},
    })
    assert.strictEqual(first({schema: false}), true)
    assert.strictEqual(second({schema: false}), false)
    assert.strictEqual(first({schema: false}), true)
  })

  it("merges evaluated items from the runtime-selected anchor", () => {
    const schema = {
      $defs: {
        extension: {$dynamicAnchor: "ext", prefixItems: [{type: "string"}]},
        base: {
          $id: "https://example.com/evaluated-items",
          $defs: {extension: {$dynamicAnchor: "ext", prefixItems: [{type: "number"}]}},
          allOf: [{$dynamicRef: "#ext"}],
          unevaluatedItems: false,
        },
      },
      $ref: "https://example.com/evaluated-items",
    }
    for (const allErrors of [false, true]) {
      for (const validate of validators(new Ajv2020({...options, allErrors}), schema)) {
        assert.strictEqual(validate(["ok"]), true)
        assert.strictEqual(validate(["ok", 42]), false)
        assert.strictEqual(validate([42]), false)
        assert.strictEqual(validate(["again"]), true)
      }
    }
  })

  it("isolates resource bindings in sibling item loops", () => {
    const list = ($id: string, type: string) => ({
      type: "array",
      items: {
        $id,
        $defs: {value: {$dynamicAnchor: "item", type}},
        $dynamicRef: "#item",
      },
    })
    for (const es5 of [false, true]) {
      const ajv = new Ajv2020({...options, code: {source: true, es5}})
      for (const validate of validators(ajv, {
        type: "object",
        properties: {
          strings: list("https://example.com/string-item", "string"),
          numbers: list("https://example.com/number-item", "number"),
        },
      })) {
        assert.strictEqual(validate({strings: ["a", "b"], numbers: [1, 2]}), true)
        assert.strictEqual(validate({strings: ["a", 2], numbers: [1, 2]}), false)
        assert.strictEqual(validate({strings: ["a", "b"], numbers: [1, "b"]}), false)
        assert.strictEqual(validate({strings: ["again"], numbers: [3]}), true)
      }
    }
  })

  it("rebuilds resource metadata after removal and re-registration", () => {
    const ajv = new Ajv2020(options)
    const $id = "https://example.com/replace"
    ajv.addSchema({...minimal, $id})
    const first = ajv.getSchema($id)!
    ajv.removeSchema($id)
    ajv.addSchema({...minimal, $id, $defs: {schema: {$dynamicAnchor: "meta", type: "number"}}})
    const second = ajv.getSchema($id)!
    assert.strictEqual(second({schema: 42}), true)
    assert.strictEqual(second({schema: false}), false)
    assert.strictEqual(first({schema: false}), true)
  })

  it("rejects duplicate anchors within one resource", () => {
    assert.throws(
      () =>
        new Ajv2020(options).compile({
          $dynamicAnchor: "same",
          $defs: {other: {$dynamicAnchor: "same", type: "string"}},
        }),
      /resolves to more than one schema/
    )
  })

  it("does not confuse anchor names with Object prototype properties", () => {
    for (const anchor of ["constructor", "toString", "__proto__"]) {
      for (const validate of validators(new Ajv2020(options), {
        $defs: {value: {$dynamicAnchor: anchor, type: "string"}},
        $dynamicRef: `#${anchor}`,
      })) {
        assert.strictEqual(validate("ok"), true)
        assert.strictEqual(validate(42), false)
      }
    }
  })

  it("reports missing dynamic targets instead of using the current validator", () => {
    assert.throws(
      () => new Ajv2020(options).compile({$dynamicRef: "#missing"}),
      /can't resolve reference/
    )
  })

  it("treats undefined context bindings as absent without mutating the caller", () => {
    for (const es5 of [false, true]) {
      const ajv = new Ajv2020({...options, code: {source: true, es5}})
      const dynamicAnchors = {meta: undefined}
      const context = {
        instancePath: "",
        parentData: {},
        parentDataProperty: "",
        rootData: {},
        dynamicAnchors,
      }
      for (const validate of validators(ajv, minimal)) {
        assert.strictEqual(validate({schema: false}, context), true)
        assert.strictEqual(validate({schema: 42}, context), false)
        assert.deepStrictEqual(dynamicAnchors, {meta: undefined})
      }
    }
  })

  it("indexes shared schema objects separately for each base URI", () => {
    const shared = {$dynamicAnchor: "item", $dynamicRef: "#check"}
    const ajv = new Ajv2020(options)
    ajv.addSchema({
      $id: "https://example.com/shared/",
      $defs: {
        first: {
          $id: "first/",
          $defs: {item: shared, check: {$dynamicAnchor: "check", type: "string"}},
        },
        second: {
          $id: "second/",
          $defs: {item: shared, check: {$dynamicAnchor: "check", type: "number"}},
        },
      },
    })
    const first = ajv.getSchema("https://example.com/shared/first/#item")!
    const second = ajv.getSchema("https://example.com/shared/second/#item")!
    assert.strictEqual(first("ok"), true)
    assert.strictEqual(first(42), false)
    assert.strictEqual(second(42), true)
    assert.strictEqual(second("ok"), false)
    if (!isBrowser) assert.strictEqual(fromString(standalone(ajv, first))("ok"), true)
  })

  it("rejects async dynamic targets explicitly", () => {
    assert.throws(
      () =>
        new Ajv2020(options).compile({
          $async: true,
          $defs: {item: {$async: true, $dynamicAnchor: "item", type: "string"}},
          $dynamicRef: "#item",
        }),
      /async dynamic/
    )
  })

  it("retries anchor compilation after loading a missing dependency", async () => {
    const ajv = new Ajv2020({
      ...options,
      loadSchema: (uri) => Promise.resolve({$id: uri, type: "string"}),
    })
    const validate = await ajv.compileAsync({
      $defs: {item: {$dynamicAnchor: "item", $ref: "https://example.com/dependency"}},
      $dynamicRef: "#item",
    })
    assert.strictEqual(validate("ok"), true)
    assert.strictEqual(validate(42), false)
    if (!isBrowser) assert.strictEqual(fromString(standalone(ajv, validate))("ok"), true)
  })

  it("loads external dynamic targets with compileAsync", async () => {
    const loads: string[] = []
    const ajv = new Ajv2020({
      ...options,
      loadSchema: (uri) => {
        loads.push(uri)
        return Promise.resolve({
          $id: uri,
          $defs: {value: {$dynamicAnchor: "value", type: "string"}},
        })
      },
    })
    const validate = await ajv.compileAsync({$dynamicRef: "https://example.com/remote#value"})
    assert.deepStrictEqual(loads, ["https://example.com/remote"])
    assert.strictEqual(validate("ok"), true)
    assert.strictEqual(validate(42), false)
    if (!isBrowser) assert.strictEqual(fromString(standalone(ajv, validate))(42), false)
  })

  it("validates OpenAPI documents and Schema Objects separately", () => {
    const document = require("./fixtures/full-dynamic-refs/openapi-schema-current.json")
    const base = require("./fixtures/full-dynamic-refs/openapi-schema-base-current.json")
    const ajv = new Ajv2020(options)
    ajv.addSchema(require("./fixtures/full-dynamic-refs/oas-vocabulary-current.json"))
    ajv.addSchema(require("./fixtures/full-dynamic-refs/oas-dialect-current.json"))
    ajv.addSchema(document)
    const valid = {
      openapi: "3.1.0",
      info: {title: "Example", version: "1.0"},
      paths: {},
      components: {schemas: {Pet: {type: "object", properties: {name: {type: "string"}}}}},
    }
    const invalid = JSON.parse(JSON.stringify(valid))
    invalid.components.schemas.Pet.type = 123
    for (const validate of validators(ajv, document)) {
      assert.strictEqual(validate(valid), true)
      assert.strictEqual(validate(invalid), true)
      assert.strictEqual(validate({...valid, info: undefined}), false)
    }
    for (const validate of validators(ajv, base)) {
      assert.strictEqual(validate(valid), true)
      assert.strictEqual(validate(invalid), false)
    }
  })
})
