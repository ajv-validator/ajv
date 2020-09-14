import type {SchemaObject, SyncSchemaObject, AsyncSchemaObject} from "../dist/types"
import _Ajv from "./ajv"
const should = require("./chai").should()

describe("validate function result type depends on $async property type", () => {
  const ajv = new _Ajv()

  describe("$async: undefined", () => {
    const validate = ajv.compile({})
    it("should have result type boolean", () => {
      const result: boolean = validate({})
      should.exist(result)
    })
  })

  describe("$async: false", () => {
    it("should have result type boolean 1", () => {
      const validate = ajv.compile({$async: false})
      const result: boolean = validate({})
      should.exist(result)
    })

    it("should have result type boolean 2", () => {
      const schema: SyncSchemaObject = {$async: false}
      const validate = ajv.compile(schema)
      const result: boolean = validate({})
      should.exist(result)
    })
  })

  describe("$async: true", () => {
    it("should have result type promise 1", async () => {
      const validate = ajv.compile({$async: true})
      const result: Promise<any> = validate({})
      await result.then((data) => data.should.exist)
    })

    it("should have result type promise 2", async () => {
      const schema: AsyncSchemaObject = {$async: true}
      const validate = ajv.compile(schema)
      const result: Promise<any> = validate({})
      await result.then((data) => data.should.exist)
    })
  })

  describe("$async: boolean", () => {
    it("should have result type boolean | promise", async () => {
      const schema = {$async: true}
      const validate = ajv.compile(schema)
      const result = validate({})
      if (typeof result === "boolean") {
        result.should.equal(true)
      } else {
        await result.then((data) => data.should.exist)
      }
    })

    it("should have result type boolean | promise", async () => {
      const schema = {$async: false}
      const validate = ajv.compile(schema)
      const result = validate({})
      if (typeof result === "boolean") {
        result.should.equal(true)
      } else {
        await result.then((data) => data.should.exist)
      }
    })
  })

  describe("= boolean", () => {
    const schema: SchemaObject = {}
    const validate = ajv.compile(schema)
    it("should have result type boolean | promise", async () => {
      const result = validate({})
      if (typeof result === "boolean") {
        should.exist(result)
      } else {
        await result.then((data) => data.should.exist)
      }
    })
  })

  describe("$async: unknown", () => {
    const schema: Record<string, unknown> = {}
    const validate = ajv.compile(schema)
    it("should have result type boolean | promise", async () => {
      const result = validate({})
      if (typeof result === "boolean") {
        should.exist(result)
      } else {
        // await result.then((data) => data.should.exist)
        await Promise.resolve()
      }
    })
  })

  describe("$async: any", () => {
    const schema: any = {}
    const validate = ajv.compile(schema)
    it("should have result type boolean | promise", async () => {
      const result = validate({})
      if (typeof result === "boolean") {
        should.exist(result)
      } else {
        // await result.then((data) => data.should.exist)
        await Promise.resolve()
      }
    })
  })
})
