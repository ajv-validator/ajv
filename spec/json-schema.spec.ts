import type Ajv from "../dist/core"
import _Ajv from "./ajv"
import _Ajv2019 from "./ajv2019"
import _Ajv2020 from "./ajv2020"
import getAjvInstances from "./ajv_instances"
import {withStandalone} from "./ajv_standalone"
import * as jsonSchemaTest from "json-schema-test"
import options from "./ajv_options"
import {afterError, afterEach} from "./after_test"
import ajvFormats from "ajv-formats"
import * as draft6MetaSchema from "../dist/refs/json-schema-draft-06.json"
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
const SKIP_DRAFT7 = [
  "optional/content",
  "optional/float-overflow",
  "unknownKeyword",
  ...SKIP_FORMAT_TESTS,
]

runTest({
  instances: getAjvInstances(_Ajv, options, {
    meta: false,
    strict: false,
    ignoreKeywordsWithRef: true,
  }),
  draft: 6,
  tests: skipTestCases(require("./_json/draft6"), {
    ref: {
      "$ref prevents a sibling $id from changing the base uri": [
        "$ref resolves to /definitions/base_foo, data does not validate",
        "$ref resolves to /definitions/base_foo, data validates",
      ],
    },
  }),
  remotes: {
    "http://localhost:1234/ref-and-definitions.json": require("./JSON-Schema-Test-Suite/remotes/ref-and-definitions.json"),
  },
  skip: ["optional/float-overflow", "unknownKeyword"],
})

runTest({
  instances: getAjvInstances(_Ajv, options, {
    strict: false,
    ignoreKeywordsWithRef: true,
    formats: toHash(SKIP_FORMATS),
  }),
  draft: 7,
  tests: skipTestCases(require("./_json/draft7"), {
    ref: {
      "$ref prevents a sibling $id from changing the base uri": [
        "$ref resolves to /definitions/base_foo, data does not validate",
        "$ref resolves to /definitions/base_foo, data validates",
      ],
    },
  }),
  remotes: {
    "http://localhost:1234/ref-and-definitions.json": require("./JSON-Schema-Test-Suite/remotes/ref-and-definitions.json"),
  },
  skip: SKIP_DRAFT7,
})

runTest({
  instances: getAjvInstances(_Ajv2019, options, {
    strict: false,
    formats: toHash(SKIP_FORMATS),
  }),
  draft: 2019,
  tests: skipTestCases(require("./_json/draft2019"), {
    recursiveRef: {
      "$recursiveRef with no $recursiveAnchor in the initial target schema resource": [
        "leaf node matches: recursion uses the inner schema",
        "leaf node does not match: recursion uses the inner schema",
      ],
      "$recursiveRef with no $recursiveAnchor in the outer schema resource": [
        "leaf node matches: recursion only uses inner schema",
        "leaf node does not match: recursion only uses inner schema",
      ],
    },
    ref: {
      "refs with relative uris and defs": [
        "invalid on inner field",
        "invalid on outer field",
        "valid on both fields",
      ],
      "relative refs with absolute uris and defs": [
        "invalid on inner field",
        "invalid on outer field",
        "valid on both fields",
      ],
    },
    unevaluatedProperties: {
      "unevaluatedProperties with if/then/else, then not defined": [
        "when if is false and has unevaluated properties",
      ],
    },
  }),
  remotes: {
    "http://localhost:1234/ref-and-defs.json": require("./JSON-Schema-Test-Suite/remotes/ref-and-defs.json"),
    "http://localhost:1234/draft2019-09/metaschema-no-validation.json": require("./JSON-Schema-Test-Suite/remotes/draft2019-09/metaschema-no-validation.json"),
  },
  skip: SKIP_DRAFT7,
})

runTest({
  instances: getAjvInstances(_Ajv2020, options, {
    strict: false,
    formats: toHash(SKIP_FORMATS),
  }),
  draft: 2020,
  tests: skipTestCases(require("./_json/draft2020"), {
    ref: {
      "refs with relative uris and defs": [
        "invalid on inner field",
        "invalid on outer field",
        "valid on both fields",
      ],
      "relative refs with absolute uris and defs": [
        "invalid on inner field",
        "invalid on outer field",
        "valid on both fields",
      ],
    },
    unevaluatedItems: {
      "unevaluatedItems depends on adjacent contains": [
        "contains passes, second item is not evaluated",
      ],
      "unevaluatedItems depends on multiple nested contains": [
        "7 not evaluated, fails unevaluatedItems",
      ],
      "unevaluatedItems and contains interact to control item dependency relationship": [
        "only b's are invalid",
        "only c's are invalid",
        "only b's and c's are invalid",
        "only a's and c's are invalid",
      ],
    },
    unevaluatedProperties: {
      "unevaluatedProperties with if/then/else, then not defined": [
        "when if is false and has unevaluated properties",
      ],
    },
  }),
  remotes: {
    "http://localhost:1234/ref-and-defs.json": require("./JSON-Schema-Test-Suite/remotes/ref-and-defs.json"),
    "http://localhost:1234/draft2020-12/format-assertion-false.json": require("./JSON-Schema-Test-Suite/remotes/draft2020-12/format-assertion-false.json"),
    "http://localhost:1234/draft2020-12/format-assertion-true.json": require("./JSON-Schema-Test-Suite/remotes/draft2020-12/format-assertion-true.json"),
    "http://localhost:1234/draft2020-12/metaschema-no-validation.json": require("./JSON-Schema-Test-Suite/remotes/draft2020-12/metaschema-no-validation.json"),
    "http://localhost:1234/tree.json": require("./JSON-Schema-Test-Suite/remotes/tree.json"),
    "http://localhost:1234/extendible-dynamic-ref.json": require("./JSON-Schema-Test-Suite/remotes/extendible-dynamic-ref.json"),
  },
  skip: [...SKIP_DRAFT7, "optional/format-assertion"],
})

interface TestSuite {
  name: string
  test: any[]
}

interface SchemaTest {
  instances: Ajv[]
  draft: number
  tests: TestSuite[]
  skip?: string[]
  remotes?: Record<string, any>
}

function runTest({instances, draft, tests, skip = [], remotes = {}}: SchemaTest) {
  for (const ajv of instances) {
    ajv.opts.code.source = true
    if (draft === 6) {
      ajv.addMetaSchema(draft6MetaSchema)
      ajv.opts.defaultMeta = "http://json-schema.org/draft-06/schema#"
    }
    for (const id in remoteRefs) ajv.addSchema(remoteRefs[id], id)
    for (const id in remotes) ajv.addSchema(remotes[id], id)
    ajvFormats(ajv)
  }

  jsonSchemaTest(withStandalone(instances), {
    description: `JSON-Schema Test Suite draft-${draft}: ${instances.length} ajv instances with different options`,
    suites: {tests},
    only: [],
    skip,
    assert: chai.assert,
    afterError,
    afterEach,
    cwd: __dirname,
    hideFolder: `draft${draft}/`,
    timeout: 30000,
  })
}

interface SkippedTestCases {
  [suite: string]: {
    [test: string]: string[] | true
  }
}

function skipTestCases(suites: TestSuite[], skipCases: SkippedTestCases): TestSuite[] {
  for (const suiteName in skipCases) {
    const suite = suites.find(({name}) => name === suiteName)
    if (!suite) throw new Error(`test suite ${suiteName} not found`)
    for (const testName in skipCases[suiteName]) {
      const test = suite.test.find(({description}) => description === testName)
      if (!test) {
        throw new Error(`test ${testName} not found in suite ${suiteName}`)
      }
      const skippedCases = skipCases[suiteName][testName]
      suite.test.forEach((t) => {
        if (t.description === testName) {
          if (skippedCases === true) {
            t.skip = true
          } else {
            t.tests.forEach((testCase: any) => {
              if (skippedCases.includes(testCase.description)) {
                testCase.skip = true
              }
            })
          }
        }
      })
    }
  }
  return suites
}
