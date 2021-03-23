import type {AnySchemaObject, SchemaObject, AsyncSchema} from "../.."
import _Ajv from "../ajv"
import chai from "../chai"
const should = chai.should()

interface Foo {
  foo: number
}

describe("$async validation and type guards", () => {
  const ajv = new _Ajv({strictTypes: false})

  describe("$async: undefined", () => {
    it("should have result type boolean 1", () => {
      const validate = ajv.compile<Foo>({
        type: "object",
        properties: {foo: {type: "number"}},
      })
      const data: unknown = {foo: 1}
      let result: boolean
      if ((result = validate(data))) {
        data.foo.should.equal(1)
      }
      result.should.equal(true)
    })

    it("should have result type boolean 2", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {foo: {type: "number"}},
      }
      const validate = ajv.compile<Foo>(schema)
      const data: unknown = {foo: 1}
      let result: boolean
      if ((result = validate(data))) {
        data.foo.should.equal(1)
      }
      result.should.equal(true)
    })

    it("should have result type boolean 3", () => {
      const schema: AnySchemaObject = {
        type: "object",
        properties: {foo: {type: "number"}},
      }
      const validate = ajv.compile<Foo>(schema)
      const data: unknown = {foo: 1}
      let result: boolean
      if ((result = validate(data))) {
        data.foo.should.equal(1)
      }
      result.should.equal(true)
    })
  })

  describe("$async: false", () => {
    it("should have result type boolean 1", () => {
      const validate = ajv.compile({$async: false})
      const result: boolean = validate({})
      should.exist(result)
    })

    it("should have result type boolean 2", () => {
      const schema: SchemaObject = {$async: false}
      const validate = ajv.compile(schema)
      const result: boolean = validate({})
      should.exist(result)
    })

    it("should have result type boolean 3", () => {
      const schema: AnySchemaObject = {$async: false}
      const validate = ajv.compile(schema)
      const result: boolean = validate({})
      should.exist(result)
    })
  })

  describe("$async: true", () => {
    it("should have result type promise 1", async () => {
      const validate = ajv.compile<Foo>({
        $async: true,
        type: "object",
        properties: {foo: {type: "number"}},
      })
      const result: Promise<Foo> = validate({foo: 1})
      await result.then((data) => data.should.exist)
    })

    it("should have result type promise 2", async () => {
      const schema: AsyncSchema = {
        $async: true,
        type: "object",
        properties: {foo: {type: "number"}},
      }
      const validate = ajv.compile<Foo>(schema)
      const result: Promise<Foo> = validate({foo: 1})
      await result.then((data) => data.foo.should.equal(1))
    })
  })

  describe("$async: boolean", () => {
    it("should have result type boolean | promise 1", async () => {
      const schema = {
        $async: true,
        type: "object",
        properties: {foo: {type: "number"}},
      }
      const validate = ajv.compile<Foo>(schema)
      const data: unknown = {foo: 1}
      let result: boolean | Promise<Foo>
      if ((result = validate(data))) {
        if (typeof result == "boolean") {
          data.foo.should.equal(1)
        } else {
          await result.then((_data) => _data.foo.should.equal(1))
        }
      } else {
        should.fail()
      }
    })

    it("should have result type boolean | promise 2", async () => {
      const schema = {$async: false}
      const validate = ajv.compile<any>(schema)
      const result = validate({})
      if (typeof result === "boolean") {
        should.exist(result)
      } else {
        await result.then((data) => data.should.exist)
      }
    })
  })

  describe("$async: unknown", () => {
    const schema: Record<string, unknown> = {
      type: "object",
      properties: {foo: {type: "number"}},
    }
    const validate = ajv.compile<Foo>(schema)

    it("should have result type boolean", () => {
      const data = {foo: 1}
      let result: boolean
      if ((result = validate(data))) {
        data.foo.should.equal(1)
      }
      result.should.equal(true)
    })
  })

  describe("schema: any", () => {
    const schema: any = {}
    const validate = ajv.compile(schema)
    it("should have result type boolean | promise", () => {
      const result: boolean = validate({})
      result.should.equal(true)
    })
  })
})
