import _Ajv from "../ajv"
import chai from "../chai"
chai.should()

describe("removeAdditional option", () => {
  it("should remove all additional properties", () => {
    const ajv = new _Ajv({removeAdditional: "all"})

    ajv.addSchema({
      $id: "//test/fooBar",
      type: "object",
      properties: {foo: {type: "string"}, bar: {type: "string"}},
    })

    const object = {
      foo: "foo",
      bar: "bar",
      baz: "baz-to-be-removed",
    }

    ajv.validate("//test/fooBar", object).should.equal(true)
    object.should.have.property("foo")
    object.should.have.property("bar")
    object.should.not.have.property("baz")
  })

  it("should remove properties that would error when `additionalProperties = false`", () => {
    const ajv = new _Ajv({removeAdditional: true})

    ajv.addSchema({
      $id: "//test/fooBar",
      type: "object",
      properties: {foo: {type: "string"}, bar: {type: "string"}},
      additionalProperties: false,
    })

    const object = {
      foo: "foo",
      bar: "bar",
      baz: "baz-to-be-removed",
    }

    ajv.validate("//test/fooBar", object).should.equal(true)
    object.should.have.property("foo")
    object.should.have.property("bar")
    object.should.not.have.property("baz")
  })

  it("should remove properties that would error when `additionalProperties = false` (many properties, boolean schema)", () => {
    const ajv = new _Ajv({removeAdditional: true})

    const schema = {
      type: "object",
      properties: {
        obj: {
          type: "object",
          additionalProperties: false,
          properties: {
            a: {type: "string"},
            b: false,
            c: {type: "string"},
            d: {type: "string"},
            e: {type: "string"},
            f: {type: "string"},
            g: {type: "string"},
            h: {type: "string"},
            i: {type: "string"},
          },
        },
      },
    }

    const data = {
      obj: {
        a: "valid",
        b: "should not be removed",
        additional: "will be removed",
      },
    }

    ajv.validate(schema, data).should.equal(false)
    data.should.eql({
      obj: {
        a: "valid",
        b: "should not be removed",
      },
    })
  })

  it("should remove properties that would error when `additionalProperties` is a schema", () => {
    const ajv = new _Ajv({removeAdditional: "failing"})

    ajv.addSchema({
      $id: "//test/fooBar",
      type: "object",
      properties: {foo: {type: "string"}, bar: {type: "string"}},
      additionalProperties: {type: "string"},
    })

    const object = {
      foo: "foo",
      bar: "bar",
      baz: "baz-to-be-kept",
      fizz: 1000,
    }

    ajv.validate("//test/fooBar", object).should.equal(true)
    object.should.have.property("foo")
    object.should.have.property("bar")
    object.should.have.property("baz")
    object.should.not.have.property("fizz")

    ajv.addSchema({
      $id: "//test/fooBar2",
      type: "object",
      properties: {foo: {type: "string"}, bar: {type: "string"}},
      additionalProperties: {type: "string", pattern: "^to-be-", maxLength: 10},
    })

    const object1 = {
      foo: "foo",
      bar: "bar",
      baz: "to-be-kept",
      quux: "to-be-removed",
      fizz: 1000,
    }

    ajv.validate("//test/fooBar2", object1).should.equal(true)
    object1.should.have.property("foo")
    object1.should.have.property("bar")
    object1.should.have.property("baz")
    object1.should.not.have.property("fizz")
  })

  describe("patternProperties without properties", () => {
    // `properties` is what used to fire the synthetic additionalProperties
    // pass, so a schema constrained only by patternProperties kept every extra
    // key under removeAdditional:"all" even though ajv 6 removed them.
    let ajv: InstanceType<typeof _Ajv>

    beforeEach(() => {
      ajv = new _Ajv({removeAdditional: "all"})
    })

    it("should remove additional properties when only patternProperties is present", () => {
      const schema = {type: "object", patternProperties: {"^a": {type: "number"}}}
      const data: any = {a1: 1, b: 2}
      ajv.validate(schema, data).should.equal(true)
      data.should.eql({a1: 1})
    })

    it("should agree with the same schema plus an empty properties", () => {
      const data1: any = {a1: 1, b: 2}
      const data2: any = {a1: 1, b: 2}
      ajv.validate({type: "object", patternProperties: {"^a": {type: "number"}}}, data1)
      ajv.validate(
        {type: "object", properties: {}, patternProperties: {"^a": {type: "number"}}},
        data2
      )
      data1.should.eql(data2)
    })

    it("should not remove additional properties for the other modes", () => {
      for (const mode of [true, "failing"] as const) {
        const local = new _Ajv({removeAdditional: mode})
        const data: any = {a1: 1, b: 2}
        local.validate({type: "object", patternProperties: {"^a": {type: "number"}}}, data)
        data.should.eql({a1: 1, b: 2})
      }
    })

    it("should still apply all three keywords together", () => {
      const schema = {
        type: "object",
        properties: {x: {type: "number"}},
        patternProperties: {"^a": {type: "number"}},
        additionalProperties: false,
      }
      const data: any = {x: 1, a1: 2, other: 3}
      ajv.validate(schema, data).should.equal(true)
      data.should.eql({x: 1, a1: 2})
    })
  })
})
