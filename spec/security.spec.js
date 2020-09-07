"use strict"

const jsonSchemaTest = require("json-schema-test"),
  getAjvInstances = require("./ajv_instances"),
  options = require("./ajv_options"),
  after = require("./after_test")

const instances = getAjvInstances(options, {
  schemas: [require("../dist/refs/json-schema-secure.json")],
})

jsonSchemaTest(instances, {
  description:
    "Secure schemas tests of " + instances.length + " ajv instances with different options",
  suites: {security: require("./_json/security")},
  assert: require("./chai").assert,
  afterError: after.error,
  afterEach: after.each,
  cwd: __dirname,
  hideFolder: "security/",
  timeout: 90000,
})
