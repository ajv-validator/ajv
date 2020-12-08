import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("$comment option", () => {
  describe("= true", () => {
    let logCalls: any[][]

    function log(...args: any[]) {
      logCalls.push(args)
    }

    const logger = {log, warn: log, error: log}

    it("should log the text from $comment keyword", () => {
      const schema = {
        $comment: "object root",
        type: "object",
        properties: {
          foo: {$comment: "property foo"},
          bar: {$comment: "property bar", type: "integer"},
        },
      }

      const ajv = new _Ajv({$comment: true, logger})
      const fullAjv = new _Ajv({allErrors: true, $comment: true, logger})

      ;[ajv, fullAjv].forEach((_ajv) => {
        const validate = _ajv.compile(schema)

        test({}, true, [["object root"]])
        test({foo: 1}, true, [["object root"], ["property foo"]])
        test({foo: 1, bar: 2}, true, [["object root"], ["property foo"], ["property bar"]])
        test({foo: 1, bar: "baz"}, false, [["object root"], ["property foo"], ["property bar"]])

        function test(data, valid, expectedLogCalls) {
          logCalls = []
          validate(data).should.equal(valid)
          logCalls.should.eql(expectedLogCalls)
        }
      })
    })
  })

  describe("function hook", () => {
    let hookCalls

    function hook(...args: any[]) {
      hookCalls.push(Array.prototype.slice.call(args))
    }

    it("should pass the text from $comment keyword to the hook", () => {
      const schema = {
        $comment: "object root",
        type: "object",
        properties: {
          foo: {$comment: "property foo"},
          bar: {$comment: "property bar", type: "integer"},
        },
      }

      const ajv = new _Ajv({$comment: hook})
      const fullAjv = new _Ajv({allErrors: true, $comment: hook})

      ;[ajv, fullAjv].forEach((_ajv) => {
        const validate = _ajv.compile(schema)

        test({}, true, [["object root", "#/$comment", schema]])
        test({foo: 1}, true, [
          ["object root", "#/$comment", schema],
          ["property foo", "#/properties/foo/$comment", schema],
        ])
        test({foo: 1, bar: 2}, true, [
          ["object root", "#/$comment", schema],
          ["property foo", "#/properties/foo/$comment", schema],
          ["property bar", "#/properties/bar/$comment", schema],
        ])
        test({foo: 1, bar: "baz"}, false, [
          ["object root", "#/$comment", schema],
          ["property foo", "#/properties/foo/$comment", schema],
          ["property bar", "#/properties/bar/$comment", schema],
        ])

        function test(data, valid, expectedHookCalls) {
          hookCalls = []
          validate(data).should.equal(valid)
          hookCalls.should.eql(expectedHookCalls)
        }
      })
    })
  })
})
