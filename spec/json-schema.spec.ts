import getAjvInstances from "./ajv_instances"
import jsonSchemaTest from "json-schema-test"
import options from "./ajv_options"
import {afterError, afterEach} from "./after_test"
import addFormats from "ajv-formats"

const remoteRefs = {
  "http://localhost:1234/integer.json": require("./JSON-Schema-Test-Suite/remotes/integer.json"),
  "http://localhost:1234/subSchemas.json": require("./JSON-Schema-Test-Suite/remotes/subSchemas.json"),
  "http://localhost:1234/baseUriChange/folderInteger.json": require("./JSON-Schema-Test-Suite/remotes/baseUriChange/folderInteger.json"),
  "http://localhost:1234/baseUriChangeFolder/folderInteger.json": require("./JSON-Schema-Test-Suite/remotes/baseUriChangeFolder/folderInteger.json"),
  "http://localhost:1234/baseUriChangeFolderInSubschema/folderInteger.json": require("./JSON-Schema-Test-Suite/remotes/baseUriChangeFolderInSubschema/folderInteger.json"),
  "http://localhost:1234/name.json": require("./JSON-Schema-Test-Suite/remotes/name.json"),
}

const SKIP = {
  6: [],
  7: [
    "optional/content",
    "optional/format/idn-email",
    "optional/format/idn-hostname",
    "optional/format/iri",
    "optional/format/iri-reference",
  ],
}

runTest(getAjvInstances(options, {meta: false, strict: false}), 6, require("./_json/draft6"))
runTest(
  getAjvInstances(options, {
    strict: false,
    unknownFormats: ["idn-email", "idn-hostname", "iri", "iri-reference"],
  }),
  7,
  require("./_json/draft7")
)

function runTest(instances, draft: number, tests) {
  for (const ajv of instances) {
    if (draft === 6) {
      ajv.addMetaSchema(require("../dist/refs/json-schema-draft-06.json"))
      ajv.opts.defaultMeta = "http://json-schema.org/draft-06/schema#"
    }
    for (const id in remoteRefs) ajv.addSchema(remoteRefs[id], id)
    addFormats(ajv)
  }

  jsonSchemaTest(instances, {
    description: `JSON-Schema Test Suite draft-0${draft}: ${instances.length} ajv instances with different options`,
    suites: {tests},
    only: [],
    skip: SKIP[draft],
    assert: require("./chai").assert,
    afterError,
    afterEach,
    cwd: __dirname,
    hideFolder: `draft${draft}/`,
    timeout: 30000,
  })
}
