/* eslint-disable @typescript-eslint/no-empty-interface */
import type {JTDSchema} from "../.."
import chai from "../chai"
const should = chai.should()

describe("JTDSchema typechecks", () => {
  it("should typecheck number schemas", () => {
    const numf: JTDSchema<number> = {type: "float64"}
    should.exist(numf)
    const numi: JTDSchema<number> = {type: "int32"}
    should.exist(numi)
    // @ts-expect-error
    const numl: JTDSchema<number> = {type: "int64"}
    should.exist(numl)
  })

  it("should typecheck boolean schemas", () => {
    const bool: JTDSchema<boolean> = {type: "boolean"}
    should.exist(bool)
    // boolean literals can't be reduced
    const boolTrue: JTDSchema<true> = {type: "boolean"}
    should.exist(boolTrue)
  })

  it("should typecheck string schemas", () => {
    const str: JTDSchema<string> = {type: "string"}
    should.exist(str)
    const time: JTDSchema<string> = {type: "timestamp"}
    should.exist(time)
  })

  it("should typecheck enumeration schemas", () => {
    const enumerate: JTDSchema<"a" | "b"> = {enum: ["a", "b"]}
    should.exist(enumerate)
    // don't need to specify everything
    const enumerateMissing: JTDSchema<"a" | "b" | "c"> = {enum: ["a", "b"]}
    should.exist(enumerateMissing)
    // @ts-expect-error
    const enumerateNumber: JTDSchema<"a" | "b" | 5> = {enum: ["a", "b"]}
    should.exist(enumerateNumber)
    // @ts-expect-error
    const enumerateString: JTDSchema<"a" | "b"> = {type: "string"}
    should.exist(enumerateString)
  })

  it("should typecheck elements schemas", () => {
    const elements: JTDSchema<number[]> = {elements: {type: "float64"}}
    should.exist(elements)
    // homogenous tuples works
    const tupleHomo: JTDSchema<[number, number]> = {elements: {type: "float64"}}
    should.exist(tupleHomo)
    // not heterogeneous
    const tupleHeteroNum: JTDSchema<[number, string]> = {
      // @ts-expect-error
      elements: {type: "float64"},
    }
    should.exist(tupleHeteroNum)
    const tupleHeteroString: JTDSchema<[number, string]> = {
      // @ts-expect-error
      elements: {type: "string"},
    }
    should.exist(tupleHeteroString)
  })

  it("should typecheck values schemas", () => {
    const values: JTDSchema<Record<string, number>> = {values: {type: "float64"}}
    should.exist(values)
    const valuesDefined: JTDSchema<{prop: number}> = {values: {type: "float64"}}
    should.exist(valuesDefined)
  })

  it("should typecheck properties schemas", () => {
    const properties: JTDSchema<{a: number; b: string}> = {
      properties: {a: {type: "float64"}, b: {type: "string"}},
    }
    should.exist(properties)
    const optionalProperties: JTDSchema<{a?: number; b?: string}> = {
      optionalProperties: {a: {type: "float64"}, b: {type: "string"}},
      additionalProperties: false,
    }
    should.exist(optionalProperties)
    const mixedProperties: JTDSchema<{a: number; b?: string}> = {
      properties: {a: {type: "float64"}},
      optionalProperties: {b: {type: "string"}},
      additionalProperties: true,
    }
    should.exist(mixedProperties)
    const fewerProperties: JTDSchema<{a: number; b: string}> = {
      // @ts-expect-error
      properties: {a: {type: "float64"}},
    }
    should.exist(fewerProperties)
  })

  it("should typecheck discriminator schemas", () => {
    interface A {
      type: "a"
      a: number
    }
    interface B {
      type: "b"
      b?: string
    }

    const union: JTDSchema<A | B> = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}}},
        b: {
          optionalProperties: {b: {type: "string"}},
        },
      },
    }
    should.exist(union)
    const unionDuplicate: JTDSchema<A | B> = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}}},
        // @ts-expect-error
        b: {properties: {a: {type: "float64"}}},
      },
    }
    should.exist(unionDuplicate)
    const unionMissing: JTDSchema<A | B> = {
      discriminator: "type",
      // @ts-expect-error
      mapping: {
        a: {properties: {a: {type: "float64"}}},
      },
    }
    should.exist(unionMissing)
  })

  it("should typecheck empty schemas", () => {
    const empty: JTDSchema<Record<string, never>> = {}
    should.exist(empty)
    // probably shouldn't accept this
    const emptyButFull: JTDSchema<{a: string}> = {}
    should.exist(emptyButFull)
  })

  it("should typecheck ref schemas", () => {
    const refs: JTDSchema<number[], {num: number}> = {
      definitions: {
        num: {type: "float64"},
      },
      elements: {ref: "num"},
    }
    should.exist(refs)
    const missingDef: JTDSchema<number[], {num: number}> = {
      // @ts-expect-error
      definitions: {},
      elements: {ref: "num"},
    }
    should.exist(missingDef)
    const missingType: JTDSchema<number[]> = {
      definitions: {},
      // @ts-expect-error
      elements: {ref: "num"},
    }
    should.exist(missingType)
  })

  it("should typecheck metadata schemas", () => {
    const meta: JTDSchema<number> = {type: "float32", metadata: {key: "val"}}
    should.exist(meta)
  })

  it("should typecheck nullable schemas", () => {
    const isNull: JTDSchema<null> = {nullable: true}
    should.exist(isNull)
    const notNull: JTDSchema<number> = {type: "float32", nullable: false}
    should.exist(notNull)
    const numNull: JTDSchema<number | null> = {type: "float32", nullable: true}
    should.exist(numNull)
    // @ts-expect-error
    const numNotNull: JTDSchema<number | null> = {type: "float32"}
    should.exist(numNotNull)
    const boolNull: JTDSchema<boolean | null> = {type: "boolean", nullable: true}
    should.exist(boolNull)
    const stringNull: JTDSchema<string | null> = {type: "string", nullable: true}
    should.exist(stringNull)
    const enumNull: JTDSchema<"a" | "b" | null> = {enum: ["a", "b"], nullable: true}
    should.exist(enumNull)
    const elementsNull: JTDSchema<string[] | null> = {
      elements: {type: "string"},
      nullable: true,
    }
    should.exist(elementsNull)
    const valuesNull: JTDSchema<Record<string, string> | null> = {
      values: {type: "string"},
      nullable: true,
    }
    should.exist(valuesNull)
    const propsNull: JTDSchema<{a: string; b: number} | null> = {
      properties: {a: {type: "string"}, b: {type: "int32"}},
      nullable: true,
    }
    should.exist(propsNull)
    const optPropsNull: JTDSchema<{a?: string; b?: number} | null> = {
      optionalProperties: {a: {type: "string"}, b: {type: "int32"}},
      nullable: true,
    }
    should.exist(optPropsNull)
    const refNull: JTDSchema<number | null, {num: number}> = {
      ref: "num",
      nullable: true,
      definitions: {num: {type: "float64"}},
    }
    should.exist(refNull)
  })
})
