import type AjvJTD from "../dist/jtd"
import type {SchemaObject} from "../dist/jtd"
import _AjvJTD from "./ajv_jtd"
import jtdValidationTests = require("./json-typedef-spec/tests/validation.json")
import assert = require("assert")

interface TestCase {
  schema: SchemaObject
  instance: unknown
  errors: TestCaseError[]
}

interface TestCaseError {
  instancePath: string[]
  schemaPath: string[]
}

const ONLY: RegExp[] = ["type", "enum", "elements"].map((s) => new RegExp(`(^|.*\\s)${s}\\s.*-`))

describe("JTD validation", () => {
  let ajv: AjvJTD

  before(() => {
    ajv = new _AjvJTD({strict: false, logger: false})
  })

  for (const testName in jtdValidationTests) {
    const {schema, instance, errors} = jtdValidationTests[testName] as TestCase
    const valid = errors.length === 0
    describeOnly(testName, () => {
      it(`should be ${valid ? "valid" : "invalid"}`, () => {
        // console.log(schema)
        // console.log(ajv.compile(schema).toString())
        assert.strictEqual(ajv.validate(schema, instance), valid)
      })
    })
  }
})

function describeOnly(name: string, func: () => void) {
  if (ONLY.length > 0 && ONLY.some((p) => p.test(name))) {
    describe(name, func)
  } else {
    describe.skip(name, func)
  }
}
