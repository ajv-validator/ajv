import type AjvJTD from "../dist/jtd"
import type {SchemaObject} from "../dist/jtd"
import _AjvJTD from "./ajv_jtd"
import getAjvInstances from "./ajv_instances"
import {withStandalone} from "./ajv_standalone"
import jtdValidationTests = require("./json-typedef-spec/tests/validation.json")
import jtdInvalidSchemasTests = require("./json-typedef-spec/tests/invalid_schemas.json")
import assert = require("assert")
// import AjvPack from "../dist/standalone/instance"

interface TestCase {
  schema: SchemaObject
  instance: unknown
  errors: TestCaseError[]
}

interface TestCaseError {
  instancePath: string[]
  schemaPath: string[]
}

// interface JTDError {
//   instancePath: string
//   schemaPath: string
// }

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

describe("JSON Type Definition", () => {
  describe("validation", function () {
    this.timeout(10000)
    let ajvs: AjvJTD[]

    before(() => {
      ajvs = getAjvInstances(_AjvJTD, {
        allErrors: true,
        inlineRefs: false,
        code: {es5: true, lines: true, optimize: false},
      }) as AjvJTD[]
      ajvs.forEach((ajv) => (ajv.opts.code.source = true))
    })

    for (const testName in jtdValidationTests) {
      const {schema, instance, errors} = jtdValidationTests[testName] as TestCase
      const valid = errors.length === 0
      describeOnly(testName, () =>
        it(`should be ${valid ? "valid" : "invalid"}`, () =>
          withStandalone(ajvs).forEach((ajv) => {
            // console.log(ajv.compile(schema).toString())
            // console.log(ajv.validate(schema, instance), ajv.errors)
            assert.strictEqual(ajv.validate(schema, instance), valid)
            // const opts = ajv instanceof AjvPack ? ajv.ajv.opts : ajv.opts
            // if (opts.allErrors) {
            //   assert.deepStrictEqual(ajv.errors, valid ? null : convertErrors(errors))
            // }
          }))
      )
    }

    // function convertErrors(errors: TestCaseError[]): JTDError[] {
    //   return errors.map((e) => ({
    //     instancePath: jsonPointer(e.instancePath),
    //     schemaPath: jsonPointer(e.schemaPath),
    //   }))
    // }

    // function jsonPointer(error: string[]): string {
    //   return error.map((s) => `/${s}`).join("")
    // }
  })

  describe("invalid schemas", () => {
    let ajv: AjvJTD

    before(() => (ajv = new _AjvJTD()))

    for (const testName in jtdInvalidSchemasTests) {
      const schema = jtdInvalidSchemasTests[testName]
      describe(testName, () =>
        it("should be invalid schema", () => assert.throws(() => ajv.compile(schema)))
      )
    }
  })

  describe("serialize", () => {
    const ajv = new _AjvJTD()

    for (const testName in jtdValidationTests) {
      const {schema, instance, errors} = jtdValidationTests[testName] as TestCase
      const valid = errors.length === 0
      if (!valid) continue
      describeOnly(testName, () =>
        it(`should serialize data`, () => {
          const serialize = ajv.compileSerializer(schema)
          // console.log(serialize.toString())
          assert.deepStrictEqual(JSON.parse(serialize(instance)), instance)
        })
      )
    }
  })

  describe.skip("parse", () => {
    const ajv = new _AjvJTD()

    for (const testName in jtdValidationTests) {
      const {schema, instance, errors} = jtdValidationTests[testName] as TestCase
      const valid = errors.length === 0
      describeOnly(testName, () => {
        if (valid) {
          it(`should parse valid JSON string`, () => {
            const parse = ajv.compileParser(schema)
            console.log(parse.toString())
            assert.deepStrictEqual(parse(JSON.stringify(instance)), instance)
          })
        } else {
          it(`should throw exception on invalid JSON string`, () => {
            const parse = ajv.compileParser(schema)
            console.log(parse.toString())
            assert.throws(() => parse(JSON.stringify(instance)))
          })
        }
      })
    }
  })
})

function describeOnly(name: string, func: () => void) {
  if (ONLY.length === 0 || ONLY.some((p) => p.test(name))) {
    describe(name, func)
  } else {
    describe.skip(name, func)
  }
}
