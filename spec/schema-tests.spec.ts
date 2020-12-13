import type AjvCore from "../dist/core"
import _Ajv from "./ajv"
import getAjvInstances from "./ajv_instances"
import {withStandalone} from "./ajv_standalone"
import jsonSchemaTest = require("json-schema-test")
import options from "./ajv_options"
import {afterError, afterEach} from "./after_test"
import ajvFormats from "ajv-formats"

const instances = getAjvInstances(_Ajv, options, {strict: false, formats: {allowedUnknown: true}})

const remoteRefs = {
  "http://localhost:1234/integer.json": require("./JSON-Schema-Test-Suite/remotes/integer.json"),
  "http://localhost:1234/folder/folderInteger.json": require("./JSON-Schema-Test-Suite/remotes/baseUriChange/folderInteger.json"),
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

jsonSchemaTest(withStandalone(instances), {
  description: `Schema tests of ${instances.length} ajv instances with different options`,
  suites: {"Schema tests": require("./_json/tests")},
  only: [],
  assert: require("./chai").assert,
  afterError,
  afterEach,
  cwd: __dirname,
  timeout: 10000,
})

function addRemoteRefsAndFormats(ajv: AjvCore) {
  ajv.opts.code.source = true
  for (const id in remoteRefs) ajv.addSchema(remoteRefs[id], id)
  ajv.addSchema(remoteRefsWithIds)
  ajvFormats(ajv)
}
