import _Ajv2019 from "../ajv2019"
import _Ajv2020 from "../ajv2020"
import chai from "../chai"
chai.should()

describe("issue #1892: discriminator with unevaluatedProperties", () => {
  const schema = {
    type: "object",
    discriminator: {propertyName: "foo"},
    required: ["foo"],
    oneOf: [
      {
        properties: {foo: {const: "x"}, a: {type: "string"}},
        required: ["a"],
      },
      {
        properties: {foo: {enum: ["y", "z"]}, b: {type: "string"}},
        required: ["b"],
      },
    ],
    unevaluatedProperties: false,
  }

  for (const [name, AjvClass] of [
    ["2019-09", _Ajv2019],
    ["2020-12", _Ajv2020],
  ] as const) {
    it(`validates branch properties with ${name}`, () => {
      const ajv = new AjvClass({discriminator: true})
      const validate = ajv.compile(schema)

      validate({foo: "x", a: "any"}).should.equal(true)
      validate({foo: "y", b: "any"}).should.equal(true)
      validate({foo: "z", b: "any"}).should.equal(true)

      validate({foo: "y", b: "any", a: "any"}).should.equal(false)
      validate({foo: "x", a: "any", extra: 1}).should.equal(false)
      ;(
        validate.errors?.[0].params as {unevaluatedProperty?: string}
      ).unevaluatedProperty?.should.equal("extra")
    })
  }
})
