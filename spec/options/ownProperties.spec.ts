import _Ajv from "../ajv"
import type Ajv from "../.."
import chai from "../chai"
chai.should()

describe("ownProperties option", () => {
  let ajv: Ajv, ajvOP: Ajv, ajvOP1: Ajv

  beforeEach(() => {
    ajv = new _Ajv({allErrors: true})
    ajvOP = new _Ajv({ownProperties: true, allErrors: true})
    ajvOP1 = new _Ajv({ownProperties: true})
  })

  it("should only validate own properties with additionalProperties", () => {
    const schema = {
      type: "object",
      properties: {a: {type: "number"}},
      additionalProperties: false,
    }

    const obj = {a: 1}
    const proto = {b: 2}
    test(schema, obj, proto)
  })

  it("should only validate own properties with properties keyword", () => {
    const schema = {
      type: "object",
      properties: {
        a: {type: "number"},
        b: {type: "number"},
      },
    }

    const obj = {a: 1}
    const proto = {b: "not a number"}
    test(schema, obj, proto)
  })

  it("should only validate own properties with required keyword", () => {
    const schema = {
      type: "object",
      required: ["a", "b"],
    }

    const obj = {a: 1}
    const proto = {b: 2}
    test(schema, obj, proto, 1, true)
  })

  it("should only validate own properties with required keyword - many properties", () => {
    ajv = new _Ajv({allErrors: true, loopRequired: 1})
    ajvOP = new _Ajv({ownProperties: true, allErrors: true, loopRequired: 1})
    ajvOP1 = new _Ajv({ownProperties: true, loopRequired: 1})

    const schema = {
      type: "object",
      required: ["a", "b", "c", "d"],
    }

    const obj = {a: 1, b: 2}
    const proto = {c: 3, d: 4}
    test(schema, obj, proto, 2, true)
  })

  it("should only validate own properties with required keyword as $data", () => {
    ajv = new _Ajv({allErrors: true, $data: true})
    ajvOP = new _Ajv({ownProperties: true, allErrors: true, $data: true})
    ajvOP1 = new _Ajv({ownProperties: true, $data: true})

    const schema = {
      type: "object",
      required: {$data: "0/req"},
      properties: {
        req: {
          type: "array",
          items: {type: "string"},
        },
      },
    }

    const obj = {
      req: ["a", "b"],
      a: 1,
    }
    const proto = {b: 2}
    test(schema, obj, proto, 1, true)
  })

  it("should only validate own properties with properties and required keyword", () => {
    const schema = {
      type: "object",
      properties: {
        a: {type: "number"},
        b: {type: "number"},
      },
      required: ["a", "b"],
    }

    const obj = {a: 1}
    const proto = {b: 2}
    test(schema, obj, proto, 1, true)
  })

  it("should only validate own properties with dependencies keyword", () => {
    const schema = {
      type: "object",
      dependencies: {
        a: ["c"],
        b: ["d"],
      },
    }

    const obj = {a: 1, c: 3}
    const proto = {b: 2}
    test(schema, obj, proto)

    const obj1 = {a: 1, b: 2, c: 3}
    const proto1 = {d: 4}
    test(schema, obj1, proto1, 1, true)
  })

  it("should only validate own properties with schema dependencies", () => {
    const schema = {
      type: "object",
      dependencies: {
        a: {not: {required: ["c"]}},
        b: {not: {required: ["d"]}},
      },
    }

    const obj = {a: 1, d: 3}
    const proto = {b: 2}
    test(schema, obj, proto)

    const obj1 = {a: 1, b: 2}
    const proto1 = {d: 4}
    test(schema, obj1, proto1)
  })

  it("should only validate own properties with patternProperties", () => {
    const schema = {
      type: "object",
      patternProperties: {"f.*o": {type: "integer"}},
    }

    const obj = {fooo: 1}
    const proto = {foo: "not a number"}
    test(schema, obj, proto)
  })

  it("should only validate own properties with propertyNames", () => {
    const schema = {
      type: "object",
      propertyNames: {
        pattern: "foo",
      },
    }

    const obj = {foo: 2}
    const proto = {bar: 1}
    test(schema, obj, proto, 2)
  })

  function test(schema, obj, proto, errors = 1, reverse?: boolean) {
    const validate = ajv.compile(schema)
    const validateOP = ajvOP.compile(schema)
    const validateOP1 = ajvOP1.compile(schema)
    const data = Object.create(proto)
    for (const key in obj) data[key] = obj[key]

    if (reverse) {
      validate(data).should.equal(true)
      validateOP(data).should.equal(false)
      validateOP.errors?.should.have.length(errors)
      validateOP1(data).should.equal(false)
      validateOP1.errors?.should.have.length(1)
    } else {
      validate(data).should.equal(false)
      validate.errors?.should.have.length(errors)
      validateOP(data).should.equal(true)
      validateOP1(data).should.equal(true)
    }
  }
})
