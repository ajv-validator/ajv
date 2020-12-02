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
  tuple?: [number, string]
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
}

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
}

describe("JSONSchemaType type and validation as a type guard", () => {
  const ajv = new _Ajv()

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
})
