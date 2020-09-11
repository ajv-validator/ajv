import type Ajv from "../dist/ajv"
import getAjvInstances from "./ajv_instances"
import jsonSchemaTest from "json-schema-test"
import options from "./ajv_options"
import {afterError, afterEach} from "./after_test"

const remoteRefs = {
  "http://localhost:1234/integer.json": require("./JSON-Schema-Test-Suite/remotes/integer.json"),
  "http://localhost:1234/subSchemas.json": require("./JSON-Schema-Test-Suite/remotes/subSchemas.json"),
  "http://localhost:1234/baseUriChange/folderInteger.json": require("./JSON-Schema-Test-Suite/remotes/baseUriChange/folderInteger.json"),
  "http://localhost:1234/baseUriChangeFolder/folderInteger.json": require("./JSON-Schema-Test-Suite/remotes/baseUriChangeFolder/folderInteger.json"),
  "http://localhost:1234/baseUriChangeFolderInSubschema/folderInteger.json": require("./JSON-Schema-Test-Suite/remotes/baseUriChangeFolderInSubschema/folderInteger.json"),
  "http://localhost:1234/name.json": require("./JSON-Schema-Test-Suite/remotes/name.json"),
}

const SKIP6 = [
  "optional/ecmascript-regex", // TODO only format needs to be skipped, too much is skipped here
  "optional/non-bmp-regex",
  "format",
  "optional/format/date",
  "optional/format/date-time",
  "optional/format/email",
  "optional/format/hostname",
  "optional/format/ipv4",
  "optional/format/ipv6",
  "optional/format/json-pointer",
  "optional/format/uri",
  "optional/format/uri-reference",
  "optional/format/uri-template",
]

const SKIP = {
  6: SKIP6,
  7: SKIP6.concat([
    "optional/content",
    "optional/format/idn-email",
    "optional/format/idn-hostname",
    "optional/format/iri",
    "optional/format/iri-reference",
    "optional/format/regex",
    "optional/format/relative-json-pointer",
    "optional/format/time",
  ]),
}

runTest(getAjvInstances(options, {meta: false, strict: false}), 6, require("./_json/draft6"))
runTest(getAjvInstances(options, {strict: false}), 7, require("./_json/draft7"))

function runTest(instances: Ajv[], draft: number, tests) {
  instances.forEach((ajv: Ajv) => {
    switch (draft) {
      case 6:
        ajv.addMetaSchema(require("../dist/refs/json-schema-draft-06.json"))
        ajv._opts.defaultMeta = "http://json-schema.org/draft-06/schema#"
        break
    }
    for (const id in remoteRefs) ajv.addSchema(remoteRefs[id], id)
  })

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
