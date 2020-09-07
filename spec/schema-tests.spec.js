"use strict"

const jsonSchemaTest = require("json-schema-test"),
  addFormats = require("ajv-formats"),
  getAjvInstances = require("./ajv_instances"),
  options = require("./ajv_options"),
  after = require("./after_test")

const instances = getAjvInstances(options, {strict: false, unknownFormats: ["allowedUnknown"]})

const remoteRefs = {
  "http://localhost:1234/integer.json": require("./JSON-Schema-Test-Suite/remotes/integer.json"),
  "http://localhost:1234/folder/folderInteger.json": require("./JSON-Schema-Test-Suite/remotes/folder/folderInteger.json"),
  "http://localhost:1234/name.json": require("./remotes/name.json"),
}

const remoteRefsWithIds = [
  require("./remotes/bar.json"),
  require("./remotes/foo.json"),
  require("./remotes/buu.json"),
  require("./remotes/tree.json"),
  require("./remotes/node.json"),
  require("./remotes/second.json"),
  require("./remotes/first.json"),
  require("./remotes/scope_change.json"),
]

instances.forEach(addRemoteRefsAndFormats)

jsonSchemaTest(instances, {
  description: "Schema tests of " + instances.length + " ajv instances with different options",
  suites: {"Schema tests": require("./_json/tests")},
  only: [],
  assert: require("./chai").assert,
  afterError: after.error,
  afterEach: after.each,
  cwd: __dirname,
  timeout: 120000,
})

function addRemoteRefsAndFormats(ajv) {
  for (const id in remoteRefs) ajv.addSchema(remoteRefs[id], id)
  ajv.addSchema(remoteRefsWithIds)
  addFormats(ajv)
}
