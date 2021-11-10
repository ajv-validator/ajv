import getAjvAllInstances from "../ajv_all_instances"
import {withStandalone} from "../ajv_standalone"
import {_} from "../../dist/compile/codegen/code"
import jsonSchemaTest = require("json-schema-test")
import options from "../ajv_options"
import {afterError, afterEach} from "../after_test"
import chai from "../chai"
import re2 from "../../dist/runtime/re2"

const instances = getAjvAllInstances(options, {
  $data: true,
  formats: {allowedUnknown: true},
  strictTypes: false,
  strictTuples: false,
})

instances.forEach((ajv) => {
  ajv.opts.code.source = true
  ajv.opts.code.formats = _`{allowedUnknown: true}`
  ajv.opts.code.regExp = re2;
})

jsonSchemaTest(withStandalone(instances), {
  description:
    "Extra keywords schemas tests of " + instances.length + " ajv instances with different options",
  suites: {extras: require("./pattern")},
  assert: chai.assert,
  afterError,
  afterEach,
  cwd: __dirname,
  hideFolder: "extras/",
  timeout: 90000,
})
