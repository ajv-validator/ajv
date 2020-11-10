import getAjvInstances from "./ajv_instances"
import jsonSchemaTest from "json-schema-test"
import options from "./ajv_options"
import {afterError, afterEach} from "./after_test"
import addFormats from "ajv-formats"
import draft6MetaSchema from "../dist/refs/json-schema-draft-06.json"
import addMetaSchema2019 from "../dist/refs/json-schema-2019-09"
import {toHash} from "../dist/compile/util"
import chai from "./chai"

const remoteRefs = {
  "http://localhost:1234/integer.json": require("./JSON-Schema-Test-Suite/remotes/integer.json"),
  "http://localhost:1234/subSchemas.json": require("./JSON-Schema-Test-Suite/remotes/subSchemas.json"),
  "http://localhost:1234/subSchemas-defs.json": require("./JSON-Schema-Test-Suite/remotes/subSchemas-defs.json"),
  "http://localhost:1234/baseUriChange/folderInteger.json": require("./JSON-Schema-Test-Suite/remotes/baseUriChange/folderInteger.json"),
  "http://localhost:1234/baseUriChangeFolder/folderInteger.json": require("./JSON-Schema-Test-Suite/remotes/baseUriChangeFolder/folderInteger.json"),
  "http://localhost:1234/baseUriChangeFolderInSubschema/folderInteger.json": require("./JSON-Schema-Test-Suite/remotes/baseUriChangeFolderInSubschema/folderInteger.json"),
  "http://localhost:1234/name.json": require("./JSON-Schema-Test-Suite/remotes/name.json"),
  "http://localhost:1234/name-defs.json": require("./JSON-Schema-Test-Suite/remotes/name-defs.json"),
}

const SKIP_FORMATS = ["idn-email", "idn-hostname", "iri", "iri-reference"]
const SKIP_FORMAT_TESTS = SKIP_FORMATS.map((f) => `optional/format/${f}`)

const SKIP = {
  6: [],
  7: ["optional/content", ...SKIP_FORMAT_TESTS],
  2019: [
    "optional/content",
    ...SKIP_FORMAT_TESTS,
    "refRemote", // TODO test "base URI change - change folder in subschema"
  ],
}

runTest(
  getAjvInstances(options, {
    meta: false,
    strict: false,
    strictTypes: false,
    ignoreKeywordsWithRef: true,
  }),
  6,
  require("./_json/draft6")
)

runTest(
  getAjvInstances(options, {
    strict: false,
    strictTypes: false,
    ignoreKeywordsWithRef: true,
    formats: toHash(SKIP_FORMATS),
  }),
  7,
  require("./_json/draft7")
)

runTest(
  getAjvInstances(options, {
    draft2019: true,
    strict: false,
    strictTypes: false,
    formats: toHash(SKIP_FORMATS),
  }),
  2019,
  require("./_json/draft2019")
)

function runTest(instances, draft: number, tests) {
  for (const ajv of instances) {
    switch (draft) {
      case 6:
        ajv.addMetaSchema(draft6MetaSchema)
        ajv.opts.defaultMeta = "http://json-schema.org/draft-06/schema#"
        break
      case 2019:
        addMetaSchema2019(ajv, true)
        break
    }
    for (const id in remoteRefs) ajv.addSchema(remoteRefs[id], id)
    addFormats(ajv)
  }

  jsonSchemaTest(instances, {
    description: `JSON-Schema Test Suite draft-${draft}: ${instances.length} ajv instances with different options`,
    suites: {tests},
    only: [],
    skip: SKIP[draft],
    assert: chai.assert,
    afterError,
    afterEach,
    cwd: __dirname,
    hideFolder: `draft${draft}/`,
    timeout: 30000,
  })
}
