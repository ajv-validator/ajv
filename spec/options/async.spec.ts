import _Ajv from "../ajv"
require("../chai").should()

describe("$async option", () => {
  const ajv = new _Ajv()

  describe("= undefined", () => {
    const validate = ajv.compile({})
    it("should return a boolean or promise", async () => {
      const result = validate({})
      if (typeof result === "boolean") {
        result.should.exist
      } else {
        await result.then((data) => data.should.exist)
      }
    })
  })

  describe("= false", () => {
    const validate = ajv.compile({$async: false})
    it("should return a boolean", () => {
      const result: boolean = validate({})
      result.should.exist
    })
  })

  describe("= true", () => {
    const validate = ajv.compile({$async: true})
    it("should return a promise", async () => {
      const result: Promise<any> = validate({})
      await result.then((data) => data.should.exist)
    })
  })

  describe("= boolean", () => {
    const schema = {$async: true}
    const validate = ajv.compile(schema)
    it("should return boolean or promise", async () => {
      const result = validate({})
      if (typeof result === "boolean") {
        result.should.exist
      } else {
        await result.then((data) => data.should.exist)
      }
    })
  })

  describe("of type unknown", () => {
    const schema: Record<string, unknown> = {}
    const validate = ajv.compile(schema)
    it("should return boolean or promise", async () => {
      const result = validate({})
      if (typeof result === "boolean") {
        result.should.exist
      } else {
        await result.then((data) => data.should.exist)
      }
    })
  })

  describe("of type any", () => {
    const schema: any = {}
    const validate = ajv.compile(schema)
    it("should return boolean or promise", async () => {
      const result = validate({})
      if (typeof result === "boolean") {
        result.should.exist
      } else {
        await result.then((data) => data.should.exist)
      }
    })
  })
})
