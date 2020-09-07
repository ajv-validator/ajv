"use strict"

const jsonSchemaTest = require("json-schema-test"),
  getAjvInstances = require("./ajv_instances"),
  options = require("./ajv_options"),
  after = require("./after_test")

const instances = getAjvInstances(options, {
  $data: true,
  unknownFormats: ["allowedUnknown"],
})

jsonSchemaTest(instances, {
  description:
    "Extra keywords schemas tests of " + instances.length + " ajv instances with different options",
  suites: {extras: require("./_json/extras")},
  assert: require("./chai").assert,
  afterError: after.error,
  afterEach: after.each,
  cwd: __dirname,
  hideFolder: "extras/",
  timeout: 90000,
})
