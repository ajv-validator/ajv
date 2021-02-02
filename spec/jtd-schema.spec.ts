import type Ajv from ".."
import type {SchemaObject} from ".."
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

describe.skip("JTD validation", () => {
  let ajv: Ajv

  before(() => {
    ajv = new _AjvJTD()
  })

  for (const testName in validation) {
    const {schema, instance, errors} = validation[testName] as TestCase
    const valid = errors.length === 0
    describe(testName, () => {
      it(`should be ${valid ? "valid" : "invalid"}`, () => {
        assert.strictEqual(ajv.validate(schema, instance), valid)
      })
    })
  }
})
