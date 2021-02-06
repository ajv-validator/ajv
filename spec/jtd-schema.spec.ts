import type AjvJTD from "../dist/jtd"
import type {SchemaObject} from "../dist/jtd"
import _AjvJTD from "./ajv_jtd"
import getAjvInstances from "./ajv_instances"
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

// const ONLY: RegExp[] = [
//   "empty",
//   "ref",
//   "type",
//   "enum",
//   "elements",
//   "properties",
//   "optionalProperties",
//   "discriminator",
//   "values",
// ].map((s) => new RegExp(`(^|.*\\s)${s}\\s.*-`))

const ONLY: RegExp[] = []

describe("JTD validation", () => {
  let ajvs: AjvJTD[]

  before(() => {
    ajvs = getAjvInstances(_AjvJTD, {
      allErrors: true,
      code: {es5: true, lines: true, optimize: false},
    })
  })

  for (const testName in jtdValidationTests) {
    const {schema, instance, errors} = jtdValidationTests[testName] as TestCase
    const valid = errors.length === 0
    describeOnly(testName, () => {
      it(`should be ${valid ? "valid" : "invalid"}`, () => {
        ajvs.forEach((ajv) => {
          // console.log(ajv.compile(schema).toString())
          // console.log(ajv.validate(schema, instance), ajv.errors)
          assert.strictEqual(ajv.validate(schema, instance), valid)
        })
      })
    })
  }
})

function describeOnly(name: string, func: () => void) {
  if (ONLY.length === 0 || ONLY.some((p) => p.test(name))) {
    describe(name, func)
  } else {
    describe.skip(name, func)
  }
}
