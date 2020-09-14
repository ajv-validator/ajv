import _Ajv from "../ajv"
import type {JSONSchemaType} from "../../dist/types/json-schema"
import type {SyncSchemaObject} from "../../dist/types"

interface MyData {
  foo: string
  bar?: number
  baz: {
    quux: "quux"
    [x: string]: string
  }
  boo?: boolean
  arr: {id: number}[]
  tuple?: [number, string]
  map: {[x: string]: number}
}

const mySchema: JSONSchemaType<MyData> = {
  type: "object",
  properties: {
    foo: {type: "string"},
    bar: {type: "number", nullable: true},
    baz: {
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
    boo: {type: "boolean", nullable: true},
    arr: {
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
    },
    tuple: {
      type: "array",
      items: [{type: "number"}, {type: "string"}],
      minItems: 2,
      additionalItems: false,
      nullable: true,
    },
    map: {
      type: "object",
      required: [],
      additionalProperties: {type: "number"},
    },
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
  }

  describe("schema has type JSONSchemaType<MyData>", () => {
    it("should prove the type of validated data", () => {
      const validate = ajv.compile<MyData>(mySchema)
      if (validate(validData)) {
        validData.foo.should.equal("foo")
      }
      if (ajv.validate<MyData>(mySchema, validData)) {
        validData.foo.should.equal("foo")
      }
    })
  })

  describe("schema has type SyncSchemaObject", () => {
    it("should prove the type of validated data", () => {
      const schema = mySchema as SyncSchemaObject
      const validate = ajv.compile<MyData>(schema)
      if (validate(validData)) {
        validData.foo.should.equal("foo")
      }
      if (ajv.validate<MyData>(schema, validData)) {
        validData.foo.should.equal("foo")
      }
    })
  })
})
