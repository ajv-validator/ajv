import getAjvInstances from "./ajv_instances"
import jsonSchemaTest from "json-schema-test"
import options from "./ajv_options"
import {afterError, afterEach} from "./after_test"

const instances = getAjvInstances(options, {
  $data: true,
  formats: {allowedUnknown: true},
})

jsonSchemaTest(instances, {
  description:
    "Extra keywords schemas tests of " + instances.length + " ajv instances with different options",
  suites: {extras: require("./_json/extras")},
  assert: require("./chai").assert,
  afterError,
  afterEach,
  cwd: __dirname,
  hideFolder: "extras/",
  timeout: 90000,
})
