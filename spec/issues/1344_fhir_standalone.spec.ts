import _Ajv from "../ajv"
import fhirSchema = require("./1344_schema.json")
import standaloneCode from "../../dist/standalone"
import requireFromString = require("require-from-string")
import assert = require("assert")

describe.only("issue #1344: FHIR schema", function () {
  this.timeout(10000)

  it("should compile to standalone code", () => {
    const ajv = new _Ajv({
      strict: false,
      code: {source: true},
    })
    ajv.addSchema(fhirSchema)
    const validate = ajv.getSchema("http://hl7.org/fhir/json-schema/4.0#/definitions/Questionnaire")
    assert(typeof validate == "function")
    assert.strictEqual(validate({}), true)

    const moduleCode = standaloneCode(ajv, validate)
    const standaloneValidate = requireFromString(moduleCode)
    assert(typeof standaloneValidate == "function")
    assert.strictEqual(standaloneValidate({}), true)
  })
})
