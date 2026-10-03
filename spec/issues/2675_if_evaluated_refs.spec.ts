import Ajv2019 from "../ajv2019"
import Ajv2020 from "../ajv2020"
import chai from "../chai"

chai.should()

describe("issue #2675: preserve evaluated references across if branches", () => {
  for (const Ajv of [Ajv2019, Ajv2020]) {
    for (const allErrors of [false, true]) {
      for (const inlineRefs of [false, true]) {
        describe(`${Ajv.name}, allErrors=${allErrors}, inlineRefs=${inlineRefs}`, () => {
          for (const unevaluatedItems of [false, {type: "string"}]) {
            it(`handles conditional all-item annotations with ${JSON.stringify(
              unevaluatedItems
            )}`, () => {
              const ajv = new Ajv({allErrors, inlineRefs})
              const validate = ajv.compile({
                type: "array",
                if: {items: {type: "number"}},
                then: {minItems: 1},
                unevaluatedItems,
              })

              validate([1, 2]).should.equal(true)
              validate(["a", "b"]).should.equal(unevaluatedItems !== false)
              validate([false]).should.equal(false)
              validate([1, "a"]).should.equal(false)
            })
          }

          it("does not retain annotations from a failing if condition", () => {
            const ajv = new Ajv({allErrors, inlineRefs})
            const validate = ajv.compile({
              type: "object",
              $ref: "#/$defs/base",
              if: {properties: {flag: {const: true}}, required: ["flag"]},
              then: {properties: {thenOnly: true}},
              else: {properties: {elseOnly: true}},
              unevaluatedProperties: false,
              $defs: {base: {type: "object", properties: {size: true}}},
            })

            validate({size: 1, flag: true, thenOnly: true}).should.equal(true)
            validate({size: 1, elseOnly: true}).should.equal(true)
            validate({size: 1, flag: false}).should.equal(false)
            validate({size: 1, flag: true, elseOnly: true}).should.equal(false)
          })

          for (const clause of ["then", "else", "both"]) {
            it(`preserves referenced properties with ${clause}`, () => {
              const ajv = new Ajv({allErrors, inlineRefs})
              const then = {properties: {size: {type: "number"}, thenOnly: true}}
              const otherwise = {properties: {elseOnly: true}}
              const validate = ajv.compile({
                type: "object",
                $ref: "#/$defs/base",
                properties: {kind: {enum: ["a", "b"]}},
                if: {properties: {kind: {const: "a"}}},
                ...(clause !== "else" && {then}),
                ...(clause !== "then" && {else: otherwise}),
                unevaluatedProperties: false,
                $defs: {base: {type: "object", properties: {size: true}}},
              })

              validate({kind: "a", size: 1}).should.equal(true)
              validate({kind: "b", size: 1}).should.equal(true)
              validate({kind: "a", size: 1, extra: true}).should.equal(false)
              validate({kind: "b", size: 1, extra: true}).should.equal(false)
              validate({kind: "b", size: 1, thenOnly: true}).should.equal(false)
              validate({kind: "a", size: 1, elseOnly: true}).should.equal(false)
              if (clause !== "else") {
                validate({kind: "a", size: 1, thenOnly: true}).should.equal(true)
                validate({kind: "a", size: "invalid"}).should.equal(false)
              }
              if (clause !== "then") {
                validate({kind: "b", size: 1, elseOnly: true}).should.equal(true)
              }
            })

            it(`preserves referenced items with ${clause}`, () => {
              const ajv = new Ajv({allErrors, inlineRefs, strictTuples: false})
              const tuple = Ajv === Ajv2020 ? "prefixItems" : "items"
              const validate = ajv.compile({
                type: "array",
                $ref: "#/$defs/base",
                if: clause === "else" ? {minItems: 1} : {maxItems: 0},
                ...(clause !== "else" && {then: {[tuple]: [true, true, true]}}),
                ...(clause !== "then" && {
                  else: clause === "else" ? {[tuple]: [true, true, true]} : {minItems: 1},
                }),
                unevaluatedItems: false,
                $defs: {base: {type: "array", [tuple]: [true, true]}},
              })

              validate([1]).should.equal(true)
              validate([1, 2]).should.equal(true)
              validate([1, 2, 3]).should.equal(false)
            })
          }
        })
      }
    }
  }
})
