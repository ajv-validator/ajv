import _Ajv from "./ajv"
import getAjvInstances from "./ajv_instances"
import jsonSchemaTest from "json-schema-test"
import options from "./ajv_options"
import {afterError, afterEach} from "./after_test"

const instances = getAjvInstances(_Ajv, options, {
  schemas: [require("../dist/refs/json-schema-secure.json")],
  strictTypes: false,
})

jsonSchemaTest(instances, {
  description:
    "Secure schemas tests of " + instances.length + " ajv instances with different options",
  suites: {security: require("./_json/security")},
  assert: require("./chai").assert,
  afterError,
  afterEach,
  cwd: __dirname,
  hideFolder: "security/",
})
