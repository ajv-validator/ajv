import _AjvJTD from "../ajv_jtd"
import validTimestamp from "../../dist/runtime/timestamp"

describe("Invalid date-time and time with trailing characters (issue #2572)", () => {
  describe("validTimestamp runtime", () => {
    it("should reject date-time strings with trailing characters after Z", () => {
      if (validTimestamp("2024-06-01T12:34:56Z", false) !== true) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56ZAS", false) !== false) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56Zx", false) !== false) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56Z ", false) !== false) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56Z\t", false) !== false) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56Z\n", false) !== false) throw new Error("fail")
    })

    it("should reject date-time strings with trailing characters after offset", () => {
      if (validTimestamp("2024-06-01T12:34:56+12:44", false) !== true) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56+12:44AS", false) !== false) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56+05:30x", false) !== false) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56-05:30 ", false) !== false) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56+00:00extra", false) !== false) throw new Error("fail")
    })

    it("should reject date-time strings with leading whitespace or characters", () => {
      if (validTimestamp(" 2024-06-01T12:34:56Z", false) !== false) throw new Error("fail")
      if (validTimestamp("X2024-06-01T12:34:56Z", false) !== false) throw new Error("fail")
    })

    it("should accept valid date-time strings", () => {
      if (validTimestamp("2024-06-01T12:34:56Z", false) !== true) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56z", false) !== true) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56+05:30", false) !== true) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56-05:30", false) !== true) throw new Error("fail")
      if (validTimestamp("2024-06-01T12:34:56.123Z", false) !== true) throw new Error("fail")
      if (validTimestamp("2024-06-01t12:34:56Z", false) !== true) throw new Error("fail")
      if (validTimestamp("2024-06-01 12:34:56Z", false) !== true) throw new Error("fail")
    })

    it("should accept valid date strings when allowDate is true", () => {
      if (validTimestamp("2024-06-01", true) !== true) throw new Error("fail")
      if (validTimestamp("2024-02-29", true) !== true) throw new Error("fail: leap year")
    })

    it("should reject invalid date strings when allowDate is true", () => {
      if (validTimestamp("2024-06-01X", true) !== false) throw new Error("fail")
      if (validTimestamp("2023-02-29", true) !== false) throw new Error("fail: not a leap year")
      if (validTimestamp("2024-13-01", true) !== false) throw new Error("fail: invalid month")
    })
  })

  describe("JTD timestamp validation end-to-end", () => {
    const ajv = new _AjvJTD({timestamp: "string"})
    const schema = {type: "timestamp"}
    const validate = ajv.compile(schema)

    it("should reject timestamps with trailing characters after Z", () => {
      if (validate("2024-06-01T12:34:56Z") !== true) throw new Error("fail")
      if (validate("2024-06-01T12:34:56ZAS") !== false) throw new Error("fail")
      if (validate("2024-06-01T12:34:56Zx") !== false) throw new Error("fail")
    })

    it("should reject timestamps with trailing characters after offset", () => {
      if (validate("2024-06-01T12:34:56+12:44") !== true) throw new Error("fail")
      if (validate("2024-06-01T12:34:56+12:44AS") !== false) throw new Error("fail")
      if (validate("2024-06-01T12:34:56+05:30extra") !== false) throw new Error("fail")
    })
  })
})
