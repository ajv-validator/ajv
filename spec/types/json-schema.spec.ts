import _Ajv from "../ajv"
import type {JSONSchemaType} from "../.."
import type {SchemaObject} from "../.."
import chai from "../chai"
const should = chai.should()

interface MyData {
  foo: string
  bar?: number // "boo" should be present if "bar" is present
  baz: {
    quux: "quux"
    [x: string]: string
  }
  boo?: true
  tuple?: readonly [number, string]
  arr: {id: number}[]
  map: {[K in string]?: number}
  notBoo?: string // should not be present if "boo" is present
  negativeIfBoo?: number // should be negative if "boo" is present
}

const arrSchema: JSONSchemaType<MyData["arr"]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: {
        type: "integer",
      },
    },
    additionalProperties: false,
    required: ["id"],
  },
  uniqueItems: true,
} as const

const mySchema: JSONSchemaType<MyData> & {
  definitions: {
    baz: JSONSchemaType<MyData["baz"]>
    tuple: JSONSchemaType<MyData["tuple"]>
  }
} = {
  type: "object",
  definitions: {
    baz: {
      // schema type is checked here ...
      type: "object",
      properties: {
        quux: {type: "string", const: "quux"},
      },
      patternProperties: {
        abc: {type: "string"},
      },
      additionalProperties: false,
      required: [],
    },
    tuple: {
      // ... and here ...
      type: "array",
      items: [{type: "number"}, {type: "string"}],
      minItems: 2,
      additionalItems: false,
      nullable: true,
    },
  },
  dependencies: {
    bar: ["boo"],
    boo: {
      not: {required: ["notBoo"]}, // optional properties can be cheched in "required" in PartialSchema
      required: ["negativeIfBoo"],
      properties: {
        // partial properties can be used in partial schemas
        negativeIfBoo: {type: "number", nullable: true, exclusiveMaximum: 0},
      },
    },
  },
  properties: {
    foo: {type: "string"},
    bar: {type: "number", nullable: true},
    baz: {$ref: "#/definitions/baz"}, // ... but it does not check type here, ...
    boo: {
      type: "boolean",
      nullable: true,
      enum: [true, null],
    },
    tuple: {$ref: "#/definitions/tuple"}, // ... nor here.
    arr: arrSchema, // ... The alternative is to define it externally - here it checks type
    map: {
      type: "object",
      required: [],
      additionalProperties: {type: "number"},
    },
    notBoo: {type: "string", nullable: true},
    negativeIfBoo: {type: "number", nullable: true},
  },
  additionalProperties: false,
  required: ["foo", "baz", "arr", "map"], // any other property added here won't typecheck
} as const

type MyUnionData = {a: boolean} | string | number

const myUnionSchema: JSONSchemaType<MyUnionData> = {
  anyOf: [
    {
      type: "object",
      properties: {
        a: {type: "boolean"},
      },
      required: ["a"],
    },
    {
      type: ["string", "number"],
      // can specify properties for either type
      minimum: 0,
      minLength: 1,
    },
  ],
} as const

// because of the current definition, you can do this nested recusion
const myNestedUnionSchema: JSONSchemaType<MyUnionData> = {
  anyOf: [
    {
      oneOf: [
        {
          type: "object",
          properties: {
            a: {type: "boolean"},
          },
          required: ["a"],
        },
        {
          type: "string",
        },
      ],
    },
    {
      type: "number",
    },
  ],
} as const

// allowing union types necessarily allows this to pass :/
const emptyType: JSONSchemaType<MyData> = {
  type: [],
} as const

type MyEnumRecord = Record<"a" | "b" | "c" | "d", number | undefined>

describe("JSONSchemaType type and validation as a type guard", () => {
  const ajv = new _Ajv({allowUnionTypes: true})

  const validData: unknown = {
    foo: "foo",
    bar: 1,
    baz: {
      quux: "quux",
      abc: "abc",
    },
    boo: true,
    arr: [{id: 1}, {id: 2}],
    tuple: [1, "abc"],
    map: {
      a: 1,
      b: 2,
    },
    negativeIfBoo: -1,
  }

  describe("schema has type JSONSchemaType<MyData>", () => {
    it("should prove the type of validated data", () => {
      const validate = ajv.compile(mySchema)
      if (validate(validData)) {
        validData.foo.should.equal("foo")
      }
      should.not.exist(validate.errors)

      if (ajv.validate(mySchema, validData)) {
        validData.foo.should.equal("foo")
      }
      should.not.exist(ajv.errors)
    })
  })

  const validUnionData: unknown = {
    a: true,
  }

  describe("schema has type JSONSchemaType<MyUnionData>", () => {
    it("should prove the type of validated data", () => {
      const validate = ajv.compile(myUnionSchema)
      if (validate(validUnionData)) {
        if (typeof validUnionData === "string") {
          should.fail("not a string")
        } else if (typeof validUnionData === "number") {
          should.fail("not a number")
        } else {
          validUnionData.a.should.equal(true)
        }
      } else {
        should.fail("is valid")
      }
      should.not.exist(validate.errors)

      if (ajv.validate(myUnionSchema, validUnionData)) {
        if (typeof validUnionData === "string") {
          should.fail("not a string")
        } else if (typeof validUnionData === "number") {
          should.fail("not a number")
        } else {
          validUnionData.a.should.equal(true)
        }
      } else {
        should.fail("is valid")
      }
      should.not.exist(ajv.errors)
    })

    it("should prove the type of validated nested data", () => {
      const validate = ajv.compile(myNestedUnionSchema)
      if (validate(validUnionData)) {
        if (typeof validUnionData === "string") {
          should.fail("not a string")
        } else if (typeof validUnionData === "number") {
          should.fail("not a number")
        } else {
          validUnionData.a.should.equal(true)
        }
      } else {
        should.fail("is valid")
      }
      should.not.exist(validate.errors)

      if (ajv.validate(myNestedUnionSchema, validUnionData)) {
        if (typeof validUnionData === "string") {
          should.fail("not a string")
        } else if (typeof validUnionData === "number") {
          should.fail("not a number")
        } else {
          validUnionData.a.should.equal(true)
        }
      } else {
        should.fail("is valid")
      }
      should.not.exist(ajv.errors)
    })

    it("should fail for invalid unions", () => {
      // @ts-expect-error extra type
      const extraSchema: JSONSchemaType<string | number> = {
        type: ["string", "number", "boolean"],
      } as const

      // @ts-expect-error extra properties
      const extraProps: JSONSchemaType<string, boolean> = {
        type: ["string", "boolean"],
        maximum: 5, // number property
      } as const

      // eslint-disable-next-line no-void
      void [extraSchema, extraProps]
    })
  })

  describe("schema has type SchemaObject", () => {
    it("should prove the type of validated data", () => {
      const schema = mySchema as SchemaObject
      const validate = ajv.compile<MyData>(schema)
      if (validate(validData)) {
        validData.foo.should.equal("foo")
      }
      should.not.exist(validate.errors)

      if (ajv.validate<MyData>(schema, validData)) {
        validData.foo.should.equal("foo")
      }
      should.not.exist(ajv.errors)
    })
  })

  describe("schema should be simple for record types", () => {
    it("typechecks a valid type without required", () => {
      const myEnumRecordSchema: JSONSchemaType<MyEnumRecord> = {
        type: "object",
        propertyNames: {enum: ["a", "b", "c", "d"]},
        additionalProperty: {type: "number"},
      }
      // eslint-disable-next-line no-void
      void myEnumRecordSchema
    })

    it("requires required for non-optional types", () => {
      // @ts-expect-error missing required
      const requiredSchema: JSONSchemaType<{a: number}> = {
        type: "object",
      }
      // eslint-disable-next-line no-void
      void requiredSchema
    })

    it("doesn't require required for optional types", () => {
      const optionalSchema: JSONSchemaType<{a?: number}> = {
        type: "object",
      }

      // eslint-disable-next-line no-void
      void optionalSchema
    })

    it("won't accept nullable for non-null types", () => {
      // @ts-expect-error can't set nullable
      const nonNullSchema: JSONSchemaType<{a: number}> = {
        type: "object",
        properties: {
          a: {
            type: "number",
            nullable: true,
          },
        },
        required: [],
      }

      // eslint-disable-next-line no-void
      void nonNullSchema
    })
  })

  describe("schema works for primitives", () => {
    it("allows partial boolean sub schemas", () => {
      // this schema doesn't have much meaning, but it wasn't allowed before
      const trueSchema: JSONSchemaType<true> = {
        type: "boolean",
        not: {const: false},
      } as const

      // eslint-disable-next-line no-void
      void trueSchema
    })

    it("validates simple null", () => {
      const nullSchema: JSONSchemaType<null> = {
        type: "null",
        nullable: true,
        const: null,
        enum: [null],
      } as const
      const validate = ajv.compile(nullSchema)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      validate(null).should.be.true
    })
  })
})

// eslint-disable-next-line no-void
void emptyType
