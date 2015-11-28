'use strict';

var jsonSchemaTest = require('json-schema-test')
  , getAjvInstances = require('./ajv_instances');

var isBrowser = typeof window == 'object';

var fullTest = isBrowser || !process.env.AJV_FAST_TEST;
var instances = getAjvInstances(fullTest ? {
  beautify:     true,
  allErrors:    true,
  verbose:      true,
  format:       'full',
  inlineRefs:   false,
  jsonPointers: true,
} : { allErrors: true }, { v5: true });


jsonSchemaTest(instances, {
  description: 'v5 schemas tests of ' + instances.length + ' ajv instances with different options',
  suites: testSuites(),
  afterError: function (res) {
    console.log('ajv options:', res.validator.opts);
  },
  cwd: __dirname,
  hideFolder: 'v5/',
  timeout: 90000
});


function testSuites() {
  if (typeof window == 'object') {
    var suites = {
      'v5 proposals': require('./v5/{**/,}*.json', {mode: 'list'})
    };
    for (var suiteName in suites) {
      suites[suiteName].forEach(function (suite) {
        suite.test = suite.module;
      });
    }
  } else {
    var suites = {
      'v5 proposals': './v5/{**/,}*.json'
    }
  }
  return suites;
}
