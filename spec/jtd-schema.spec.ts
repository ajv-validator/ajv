import type AjvJTD from "../dist/jtd"
import type {SchemaObject} from "../dist/jtd"
import _AjvJTD from "./ajv_jtd"
import {validation} from "./_json/jtd"
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

const ONLY: RegExp[] = []

describe.skip("JTD validation", () => {
  let ajv: AjvJTD

  before(() => {
    ajv = new _AjvJTD({strict: false})
  })

  for (const testName in validation) {
    const {schema, instance, errors} = validation[testName] as TestCase
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
    describe.only(name, func)
  } else {
    describe(name, func)
  }
}
