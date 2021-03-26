/* eslint-disable @typescript-eslint/no-empty-interface,no-void */
import _Ajv from "../ajv_jtd"
import type {JTDSchemaType, JTDDataType} from "../../dist/jtd"
import chai from "../chai"
const should = chai.should()

/** type is true if T is identically E */
type TypeEquality<T, E> = [T] extends [E] ? ([E] extends [T] ? true : false) : false

interface A {
  type: "a"
  a: number
}

interface B {
  type: "b"
  b?: string
}

type MyData = A | B

interface LinkedList {
  val: number
  next?: LinkedList
}

const mySchema: JTDSchemaType<MyData> = {
  discriminator: "type",
  mapping: {
    a: {properties: {a: {type: "float64"}}},
    b: {optionalProperties: {b: {type: "string"}}},
  },
}

describe("JTDSchemaType", () => {
  it("validation should prove the data type", () => {
    const ajv = new _Ajv()
    const validate = ajv.compile(mySchema)
    const validData: unknown = {type: "a", a: 1}
    if (validate(validData) && validData.type === "a") {
      validData.a.should.equal(1)
    }
    should.not.exist(validate.errors)

    if (ajv.validate(mySchema, validData) && validData.type === "a") {
      validData.a.should.equal(1)
    }
    should.not.exist(ajv.errors)
  })

  it("parser should return correct data type", () => {
    const ajv = new _Ajv()
    const parse = ajv.compileParser(mySchema)
    const validJson = '{"type": "a", "a": 1}'
    const data = parse(validJson)
    if (data !== undefined && data.type === "a") {
      data.a.should.equal(1)
    }
    should.not.exist(parse.message)
  })

  it("serializer should only accept correct data type", () => {
    const ajv = new _Ajv()
    const serialize = ajv.compileSerializer(mySchema)
    const validData = {type: "a" as const, a: 1}
    serialize(validData).should.equal('{"type":"a","a":1}')
    const invalidData = {type: "a" as const, b: "test"}
    // @ts-expect-error
    serialize(invalidData)
  })

  it("should typecheck number schemas", () => {
    const numf: JTDSchemaType<number> = {type: "float64"}
    const numi: JTDSchemaType<number> = {type: "int32"}
    // @ts-expect-error
    const numl: JTDSchemaType<number> = {type: "int64"}
    // number literals don't work
    // @ts-expect-error
    const nums: JTDSchemaType<1 | 2 | 3> = {type: "int32"}
    const numNull: JTDSchemaType<number | null> = {type: "int32", nullable: true}
    // @ts-expect-error
    const numNotNull: JTDSchemaType<number | null> = {type: "float32"}

    void [numf, numi, numl, nums, numNull, numNotNull]
  })

  it("should typecheck boolean schemas", () => {
    const bool: JTDSchemaType<boolean> = {type: "boolean"}
    // boolean literals don't
    // @ts-expect-error
    const boolTrue: JTDSchemaType<true> = {type: "boolean"}
    const boolNull: JTDSchemaType<boolean | null> = {type: "boolean", nullable: true}

    void [bool, boolTrue, boolNull]
  })

  it("should typecheck string schemas", () => {
    const str: JTDSchemaType<string> = {type: "string"}
    const time: JTDSchemaType<string> = {type: "timestamp"}
    const strNull: JTDSchemaType<string | null> = {type: "string", nullable: true}

    void [str, time, strNull]
  })

  it("should typecheck dates", () => {
    const time: JTDSchemaType<Date> = {type: "timestamp"}
    const timeNull: JTDSchemaType<Date | null> = {type: "timestamp", nullable: true}

    void [time, timeNull]
  })

  it("should typecheck enumeration schemas", () => {
    const enumerate: JTDSchemaType<"a" | "b"> = {enum: ["a", "b"]}
    // don't need to specify everything
    const enumerateMissing: JTDSchemaType<"a" | "b" | "c"> = {enum: ["a", "b"]}
    // must all be string literals
    // @ts-expect-error
    const enumerateNumber: JTDSchemaType<"a" | "b" | 5> = {enum: ["a", "b"]}
    // can't overgeneralize in schema
    // @ts-expect-error
    const enumerateString: JTDSchemaType<"a" | "b"> = {type: "string"}
    const enumerateNull: JTDSchemaType<"a" | "b" | null> = {enum: ["a", "b"], nullable: true}

    void [enumerate, enumerateMissing, enumerateNumber, enumerateString, enumerateNull]
  })

  it("should typecheck elements schemas", () => {
    const elements: JTDSchemaType<number[]> = {elements: {type: "float64"}}
    const readonlyElements: JTDSchemaType<readonly number[]> = {elements: {type: "float64"}}
    // tuples don't work
    // @ts-expect-error
    const tupleHomo: JTDSchemaType<[number, number]> = {elements: {type: "float64"}}
    const tupleHeteroNum: JTDSchemaType<[number, string]> = {
      // @ts-expect-error
      elements: {type: "float64"},
    }
    const tupleHeteroString: JTDSchemaType<[number, string]> = {
      // @ts-expect-error
      elements: {type: "string"},
    }
    const elemNull: JTDSchemaType<number[] | null> = {elements: {type: "float64"}, nullable: true}

    // can typecheck an array of unions
    const unionElem: TypeEquality<JTDSchemaType<(A | B)[]>, never> = false
    // can't typecheck a union of arrays
    const elemUnion: TypeEquality<JTDSchemaType<A[] | B[]>, never> = true

    void [
      elements,
      readonlyElements,
      tupleHomo,
      tupleHeteroNum,
      tupleHeteroString,
      elemNull,
      unionElem,
      elemUnion,
    ]
  })

  it("should typecheck values schemas", () => {
    const values: JTDSchemaType<Record<string, number>> = {values: {type: "float64"}}
    const readonlyValues: JTDSchemaType<Readonly<Record<string, number>>> = {
      values: {type: "float64"},
    }
    // values must be a whole mapping
    // @ts-expect-error
    const valuesDefined: JTDSchemaType<{prop: number}> = {values: {type: "float64"}}
    const valuesNull: JTDSchemaType<Record<string, number> | null> = {
      values: {type: "float64"},
      nullable: true,
    }

    // can typecheck a values of unions
    const unionValues: TypeEquality<JTDSchemaType<Record<string, A | B>>, never> = false
    // can't typecheck a union of values
    const valuesUnion: TypeEquality<
      JTDSchemaType<Record<string, A> | Record<string, B>>,
      never
    > = true

    void [values, readonlyValues, valuesDefined, valuesNull, unionValues, valuesUnion]
  })

  it("should typecheck properties schemas", () => {
    const properties: JTDSchemaType<{a: number; b: string}> = {
      properties: {a: {type: "float64"}, b: {type: "string"}},
    }
    const optionalProperties: JTDSchemaType<{a?: number; b?: string}> = {
      optionalProperties: {a: {type: "float64"}, b: {type: "string"}},
      additionalProperties: false,
    }
    const mixedProperties: JTDSchemaType<{a: number; b?: string}> = {
      properties: {a: {type: "float64"}},
      optionalProperties: {b: {type: "string"}},
      additionalProperties: true,
    }
    const fewerProperties: JTDSchemaType<{a: number; b: string}> = {
      // @ts-expect-error
      properties: {a: {type: "float64"}},
    }
    const propertiesNull: JTDSchemaType<{a: number; b: string} | null> = {
      properties: {a: {type: "float64"}, b: {type: "string"}},
      nullable: true,
    }

    void [properties, optionalProperties, mixedProperties, fewerProperties, propertiesNull]
  })

  it("should typecheck discriminator schemas", () => {
    const union: JTDSchemaType<A | B> = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}}},
        b: {
          optionalProperties: {b: {type: "string"}},
        },
      },
    }
    // can't mess up, e.g. value type isn't a union
    const unionDuplicate: JTDSchemaType<A | B> = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}}},
        // @ts-expect-error
        b: {properties: {a: {type: "float64"}}},
      },
    }
    // must specify everything
    const unionMissing: JTDSchemaType<A | B> = {
      discriminator: "type",
      // @ts-expect-error
      mapping: {
        a: {properties: {a: {type: "float64"}}},
      },
    }
    // can use any valid discrinimator
    type Mult = JTDSchemaType<(A & {typ: "alpha"}) | (B & {typ: "beta"})>
    const multOne: Mult = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}, typ: {enum: ["alpha"]}}},
        b: {
          properties: {typ: {enum: ["beta"]}},
          optionalProperties: {b: {type: "string"}},
        },
      },
    }
    const multTwo: Mult = {
      discriminator: "typ",
      mapping: {
        alpha: {properties: {a: {type: "float64"}, type: {enum: ["a"]}}},
        beta: {
          properties: {type: {enum: ["b"]}},
          optionalProperties: {b: {type: "string"}},
        },
      },
    }
    const unionNull: JTDSchemaType<A | B | null> = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}}},
        b: {
          optionalProperties: {b: {type: "string"}},
        },
      },
      nullable: true,
    }

    // properties must have common key
    const noCommon: TypeEquality<
      JTDSchemaType<{key1: "a"; a: number} | {key2: "b"; b: string}>,
      never
    > = true

    void [union, unionDuplicate, unionMissing, multOne, multTwo, unionNull, noCommon]
  })

  it("should typecheck empty schemas", () => {
    const empty: JTDSchemaType<unknown> = {}
    // unknown can be null
    const emptyUnknown: JTDSchemaType<unknown> = {nullable: true}
    // somewhat unintuitively, it can still have nullable: false even though it can be null
    const falseUnknown: JTDSchemaType<unknown> = {nullable: false}
    // can only use empty for empty and null
    // @ts-expect-error
    const emptyButFull: JTDSchemaType<{a: string}> = {}
    const emptyMeta: JTDSchemaType<unknown> = {metadata: {}}

    // constant null not representable
    const emptyNull: TypeEquality<JTDSchemaType<null>, never> = true

    void [empty, emptyUnknown, falseUnknown, emptyButFull, emptyMeta, emptyNull]
  })

  it("should typecheck ref schemas", () => {
    const refs: JTDSchemaType<number[], {num: number}> = {
      definitions: {
        num: {type: "float64"},
      },
      elements: {ref: "num"},
    }
    const missingDef: JTDSchemaType<number[], {num: number}> = {
      // @ts-expect-error
      definitions: {},
      elements: {ref: "num"},
    }
    const missingType: JTDSchemaType<number[]> = {
      definitions: {},
      // @ts-expect-error
      elements: {ref: "num"},
    }
    const nullRefs: JTDSchemaType<number | null, {num: number}> = {
      definitions: {
        num: {type: "float64"},
      },
      ref: "num",
      nullable: true,
    }
    const refsNullOne: JTDSchemaType<number | null, {num: number | null}> = {
      definitions: {
        num: {type: "float64", nullable: true},
      },
      ref: "num",
    }
    const refsNullTwo: JTDSchemaType<number | null, {num: number | null}> = {
      definitions: {
        num: {type: "float64", nullable: true},
      },
      ref: "num",
      nullable: true,
    }

    void [refs, missingDef, missingType, nullRefs, refsNullOne, refsNullTwo]
  })

  it("should typecheck metadata schemas", () => {
    const meta: JTDSchemaType<number> = {type: "float32", metadata: {key: "val"}}
    const emptyMeta: JTDSchemaType<unknown> = {metadata: {key: "val"}}
    const unknownMeta: JTDSchemaType<unknown> = {nullable: true, metadata: {key: "val"}}

    void [meta, emptyMeta, unknownMeta]
  })
})

describe("JTDDataType", () => {
  it("validation should prove the data type", () => {
    const ajv = new _Ajv()
    const mySchema1 = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}}},
        b: {optionalProperties: {b: {type: "string"}}},
      },
    } as const

    type MyData1 = JTDDataType<typeof mySchema1>

    const validate = ajv.compile<MyData1>(mySchema1)
    const validData: unknown = {type: "a", a: 1}
    if (validate(validData) && validData.type === "a") {
      validData.a.should.equal(1)
    }
    should.not.exist(validate.errors)

    if (ajv.validate<MyData1>(mySchema1, validData) && validData.type === "a") {
      validData.a.should.equal(1)
    }
    should.not.exist(ajv.errors)
  })

  it("should typecheck number schemas", () => {
    const numSchema = {type: "float64"} as const
    const num: TypeEquality<JTDDataType<typeof numSchema>, number> = true

    void [num]
  })

  it("should typecheck string schemas", () => {
    const strSchema = {type: "string"} as const
    const str: TypeEquality<JTDDataType<typeof strSchema>, string> = true

    void [str]
  })

  it("should typecheck timestamp schemas", () => {
    const timeSchema = {type: "timestamp"} as const
    const time: TypeEquality<JTDDataType<typeof timeSchema>, string | Date> = true

    void [time]
  })

  it("should typecheck enum schemas", () => {
    const enumSchema = {enum: ["a", "b"]} as const
    const enumerated: TypeEquality<JTDDataType<typeof enumSchema>, "a" | "b"> = true

    // if you forget const on an enum it will error
    const enumStringSchema = {enum: ["a", "b"]}
    const enumString: TypeEquality<JTDDataType<typeof enumStringSchema>, never> = true
    // also if not a string
    const enumNumSchema = {enum: [3]} as const
    const enumNum: TypeEquality<JTDDataType<typeof enumNumSchema>, never> = true

    void [enumerated, enumString, enumNum]
  })

  it("should typecheck elements schemas", () => {
    const elementsSchema = {elements: {type: "float64"}} as const
    const elem: TypeEquality<JTDDataType<typeof elementsSchema>, number[]> = true

    void [elem]
  })

  it("should typecheck properties schemas", () => {
    const bothPropsSchema = {
      properties: {a: {type: "float64"}},
      optionalProperties: {b: {type: "string"}},
    } as const
    const both: TypeEquality<JTDDataType<typeof bothPropsSchema>, {a: number; b?: string}> = true

    const reqPropsSchema = {properties: {a: {type: "float64"}}} as const
    const req: TypeEquality<JTDDataType<typeof reqPropsSchema>, {a: number}> = true

    const optPropsSchema = {optionalProperties: {b: {type: "string"}}} as const
    const opt: TypeEquality<JTDDataType<typeof optPropsSchema>, {b?: string}> = true

    const noAddSchema = {
      optionalProperties: {b: {type: "string"}},
      additionalProperties: false,
    } as const
    const noAdd: TypeEquality<JTDDataType<typeof noAddSchema>, {b?: string}> = true

    const addSchema = {
      optionalProperties: {b: {type: "string"}},
      additionalProperties: true,
    } as const
    const add: TypeEquality<
      JTDDataType<typeof addSchema>,
      {b?: string; [key: string]: unknown}
    > = true
    const addVal: JTDDataType<typeof addSchema> = {b: "b", additional: 6}

    void [both, req, opt, noAdd, add, addVal]
  })

  it("should typecheck values schemas", () => {
    const valuesSchema = {values: {type: "float64"}} as const
    const values: TypeEquality<JTDDataType<typeof valuesSchema>, Record<string, number>> = true

    void [values]
  })

  it("should typecheck discriminator schemas", () => {
    const discriminatorSchema = {
      discriminator: "type",
      mapping: {
        a: {properties: {a: {type: "float64"}}},
        b: {optionalProperties: {b: {type: "string"}}},
      },
    } as const
    const disc: TypeEquality<JTDDataType<typeof discriminatorSchema>, A | B> = true

    void [disc]
  })

  it("should typecheck ref schemas", () => {
    const refSchema = {
      definitions: {num: {type: "float64", nullable: true}},
      ref: "num",
      nullable: true,
    } as const
    const ref: TypeEquality<JTDDataType<typeof refSchema>, number | null> = true

    // works for recursive schemas
    const llSchema = {
      definitions: {
        node: {
          properties: {val: {type: "float64"}},
          optionalProperties: {next: {ref: "node"}},
        },
      },
      ref: "node",
    } as const
    const list: TypeEquality<JTDDataType<typeof llSchema>, LinkedList> = true

    void [ref, list]
  })

  it("should typecheck empty schemas", () => {
    const emptySchema = {metadata: {}} as const
    const empty: TypeEquality<JTDDataType<typeof emptySchema>, unknown> = true

    void [empty]
  })
})
