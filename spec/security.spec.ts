import getAjvInstances from "./ajv_instances"
import jsonSchemaTest from "json-schema-test"
import options from "./ajv_options"
import {afterError, afterEach} from "./after_test"

const instances = getAjvInstances(options, {
  schemas: [require("../dist/refs/json-schema-secure.json")],
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
