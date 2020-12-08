import _Ajv from "../ajv"
import getAjvInstances from "../ajv_instances"
import chai from "../chai"
chai.should()

describe("useDefaults option", () => {
  it("should replace undefined property with default value", () => {
    const instances = getAjvInstances(
      _Ajv,
      {
        allErrors: true,
        loopRequired: 3,
      },
      {useDefaults: true}
    )

    instances.forEach(test)

    function test(ajv) {
      const schema = {
        type: "object",
        properties: {
          foo: {type: "string", default: "abc"},
          bar: {type: "number", default: 1},
          baz: {type: "boolean", default: false},
          nil: {type: "null", default: null},
          obj: {type: "object", default: {}},
          arr: {type: "array", default: []},
        },
        required: ["foo", "bar", "baz", "nil", "obj", "arr"],
        minProperties: 6,
      }

      const validate = ajv.compile(schema)

      let data = {}
      validate(data).should.equal(true)
      data.should.eql({
        foo: "abc",
        bar: 1,
        baz: false,
        nil: null,
        obj: {},
        arr: [],
      })

      data = {foo: "foo", bar: 2, obj: {test: true}}
      validate(data).should.equal(true)
      data.should.eql({
        foo: "foo",
        bar: 2,
        baz: false,
        nil: null,
        obj: {test: true},
        arr: [],
      })
    }
  })

  it("should replace undefined item with default value", () => {
    test(new _Ajv({useDefaults: true}))
    test(new _Ajv({useDefaults: true, allErrors: true}))

    function test(ajv) {
      const schema = {
        type: "array",
        items: [
          {type: "string", default: "abc"},
          {type: "number", default: 1},
          {type: "boolean", default: false},
        ],
        minItems: 3,
        additionalItems: false,
      }

      const validate = ajv.compile(schema)

      let data: any = []
      validate(data).should.equal(true)
      data.should.eql(["abc", 1, false])

      data = ["foo"]
      validate(data).should.equal(true)
      data.should.eql(["foo", 1, false])

      data = ["foo", 2, "false"]
      validate(data).should.equal(false)
      validate.errors.should.have.length(1)
      data.should.eql(["foo", 2, "false"])
    }
  })

  it('should apply default in "then" subschema (issue #635)', () => {
    test(new _Ajv({useDefaults: true}))
    test(new _Ajv({useDefaults: true, allErrors: true}))

    function test(ajv) {
      const schema = {
        type: "object",
        if: {required: ["foo"]},
        then: {
          properties: {
            bar: {default: 2},
          },
        },
        else: {
          properties: {
            foo: {default: 1},
          },
        },
      }

      const validate = ajv.compile(schema)

      let data = {}
      validate(data).should.equal(true)
      data.should.eql({foo: 1})

      data = {foo: 1}
      validate(data).should.equal(true)
      data.should.eql({foo: 1, bar: 2})
    }
  })

  describe("useDefaults: defaults are always passed by value", () => {
    it("should NOT modify underlying defaults when modifying validated data", () => {
      test(new _Ajv({useDefaults: true}))
      test(new _Ajv({useDefaults: true, allErrors: true}))
    })

    function test(ajv) {
      const schema = {
        type: "object",
        properties: {
          items: {
            type: "array",
            default: ["a-default"],
          },
        },
      }

      const validate = ajv.compile(schema)

      const data: any = {}
      validate(data).should.equal(true)
      data.items.should.eql(["a-default"])

      data.items.push("another-value")
      data.items.should.eql(["a-default", "another-value"])

      const data2: any = {}
      validate(data2).should.equal(true)

      data2.items.should.eql(["a-default"])
    }
  })

  describe('defaults with "empty" values', () => {
    let schema, data

    beforeEach(() => {
      schema = {
        type: "object",
        properties: {
          obj: {
            type: "object",
            properties: {
              str: {default: "foo"},
              n1: {default: 1},
              n2: {default: 2},
              n3: {default: 3},
            },
          },
          arr: {
            type: "array",
            items: [{default: "foo"}, {default: 1}, {default: 2}, {default: 3}],
            minItems: 4,
            additionalItems: false,
          },
        },
      }

      data = {
        obj: {
          str: "",
          n1: null,
          n2: undefined,
        },
        arr: ["", null, undefined],
      }
    })

    it('should NOT assign defaults when useDefaults is true/"shared"', () => {
      test(new _Ajv({useDefaults: true}))

      function test(ajv) {
        const validate = ajv.compile(schema)
        validate(data).should.equal(true)
        data.should.eql({
          obj: {
            str: "",
            n1: null,
            n2: 2,
            n3: 3,
          },
          arr: ["", null, 2, 3],
        })
      }
    })

    it('should assign defaults when useDefaults = "empty"', () => {
      const ajv = new _Ajv({useDefaults: "empty"})
      const validate = ajv.compile(schema)
      validate(data).should.equal(true)
      data.should.eql({
        obj: {
          str: "foo",
          n1: 1,
          n2: 2,
          n3: 3,
        },
        arr: ["foo", 1, 2, 3],
      })
    })
  })
})
