"use strict"

const Ajv = require("../ajv")
require("../chai").should()

describe("ownProperties option", () => {
  let ajv, ajvOP, ajvOP1

  beforeEach(() => {
    ajv = new Ajv({allErrors: true})
    ajvOP = new Ajv({ownProperties: true, allErrors: true})
    ajvOP1 = new Ajv({ownProperties: true})
  })

  it("should only validate own properties with additionalProperties", () => {
    const schema = {
      properties: {a: {type: "number"}},
      additionalProperties: false,
    }

    const obj = {a: 1}
    const proto = {b: 2}
    test(schema, obj, proto)
  })

  it("should only validate own properties with properties keyword", () => {
    const schema = {
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
      required: ["a", "b"],
    }

    const obj = {a: 1}
    const proto = {b: 2}
    test(schema, obj, proto, 1, true)
  })

  it("should only validate own properties with required keyword - many properties", () => {
    ajv = new Ajv({allErrors: true, loopRequired: 1})
    ajvOP = new Ajv({ownProperties: true, allErrors: true, loopRequired: 1})
    ajvOP1 = new Ajv({ownProperties: true, loopRequired: 1})

    const schema = {
      required: ["a", "b", "c", "d"],
    }

    const obj = {a: 1, b: 2}
    const proto = {c: 3, d: 4}
    test(schema, obj, proto, 2, true)
  })

  it("should only validate own properties with required keyword as $data", () => {
    ajv = new Ajv({allErrors: true, $data: true})
    ajvOP = new Ajv({ownProperties: true, allErrors: true, $data: true})
    ajvOP1 = new Ajv({ownProperties: true, $data: true})

    const schema = {
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
      dependencies: {
        a: ["c"],
        b: ["d"],
      },
    }

    let obj = {a: 1, c: 3}
    let proto = {b: 2}
    test(schema, obj, proto)

    obj = {a: 1, b: 2, c: 3}
    proto = {d: 4}
    test(schema, obj, proto, 1, true)
  })

  it("should only validate own properties with schema dependencies", () => {
    const schema = {
      dependencies: {
        a: {not: {required: ["c"]}},
        b: {not: {required: ["d"]}},
      },
    }

    let obj = {a: 1, d: 3}
    let proto = {b: 2}
    test(schema, obj, proto)

    obj = {a: 1, b: 2}
    proto = {d: 4}
    test(schema, obj, proto)
  })

  it("should only validate own properties with patternProperties", () => {
    const schema = {
      patternProperties: {"f.*o": {type: "integer"}},
    }

    const obj = {fooo: 1}
    const proto = {foo: "not a number"}
    test(schema, obj, proto)
  })

  it("should only validate own properties with propertyNames", () => {
    const schema = {
      propertyNames: {
        pattern: "foo",
      },
    }

    const obj = {foo: 2}
    const proto = {bar: 1}
    test(schema, obj, proto, 2)
  })

  function test(schema, obj, proto, errors, reverse) {
    errors = errors || 1
    const validate = ajv.compile(schema)
    const validateOP = ajvOP.compile(schema)
    const validateOP1 = ajvOP1.compile(schema)
    const data = Object.create(proto)
    for (const key in obj) data[key] = obj[key]

    if (reverse) {
      validate(data).should.equal(true)
      validateOP(data).should.equal(false)
      validateOP.errors.should.have.length(errors)
      validateOP1(data).should.equal(false)
      validateOP1.errors.should.have.length(1)
    } else {
      validate(data).should.equal(false)
      validate.errors.should.have.length(errors)
      validateOP(data).should.equal(true)
      validateOP1(data).should.equal(true)
    }
  }
})
