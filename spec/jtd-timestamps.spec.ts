import _AjvJTD from "./ajv_jtd"
import assert = require("assert")
import type {JTDOptions, JTDSchemaType} from "../dist/jtd"

describe("JTD timestamps", function () {
  this.timeout(10000)

  describe("validation", () => {
    it("should accept dates or strings by default", () => {
      testTimestamp({}, {Date: true, datetime: true, date: false})
    })

    it("timestamp: string should accept only strings", () => {
      testTimestamp({timestamp: "string"}, {Date: false, datetime: true, date: false})
    })

    it("timestamp: date should accept only Date objects", () => {
      testTimestamp({timestamp: "date"}, {Date: true, datetime: false, date: false})
    })

    it("allowDate: true should accept date without time component", () => {
      testTimestamp({allowDate: true}, {Date: true, datetime: true, date: true})
      testTimestamp(
        {allowDate: true, timestamp: "string"},
        {Date: false, datetime: true, date: true}
      )
      testTimestamp(
        {allowDate: true, timestamp: "date"},
        {Date: true, datetime: false, date: false}
      )
    })

    function testTimestamp(
      opts: JTDOptions,
      valid: {Date: boolean; datetime: boolean; date: boolean}
    ) {
      const ajv = new _AjvJTD(opts)
      const schema = {type: "timestamp"}
      const validate = ajv.compile(schema)
      assert.strictEqual(validate(new Date()), valid.Date)
      assert.strictEqual(validate("2021-05-03T05:24:43.906Z"), valid.datetime)
      assert.strictEqual(validate("2021-05-03"), valid.date)
      assert.strictEqual(validate("foo"), false)
    }
  })

  describe("parseDate option", () => {
    it("should parse timestamp as Date object", () => {
      const schema: JTDSchemaType<Date> = {type: "timestamp"}
      const ajv = new _AjvJTD({parseDate: true})
      const parseTS = ajv.compileParser(schema)
      assert.strictEqual(
        parseTS('"2021-05-14T17:59:03.851Z"')?.toISOString(),
        "2021-05-14T17:59:03.851Z"
      )
      assert.strictEqual(parseTS('"2021-05-14"')?.toISOString(), undefined)
    })

    it("allowDate: true should parse timestamp and date as Date objects", () => {
      const schema: JTDSchemaType<Date> = {type: "timestamp"}
      const ajv = new _AjvJTD({parseDate: true, allowDate: true})
      const parseTS = ajv.compileParser(schema)
      assert.strictEqual(
        parseTS('"2021-05-14T17:59:03.851Z"')?.toISOString(),
        "2021-05-14T17:59:03.851Z"
      )
      assert.strictEqual(parseTS('"2021-05-14"')?.toISOString(), "2021-05-14T00:00:00.000Z")
    })
  })

  describe("serializing Date objects", () => {
    it("should serialize Date as JSON string", () => {
      const schema: JTDSchemaType<Date> = {type: "timestamp"}
      const ajv = new _AjvJTD()
      const serializeTS = ajv.compileSerializer(schema)
      assert.strictEqual(
        serializeTS(new Date("2021-05-14T17:59:03.851Z")),
        '"2021-05-14T17:59:03.851Z"'
      )
    })
  })
})
