'use strict';

var jsonSchemaTest = require('json-schema-test')
  , getAjvInstances = require('./ajv_instances')
  , options = require('./ajv_options');

var instances = getAjvInstances(options, { v5: true });


jsonSchemaTest(instances, {
  description: 'v5 schemas tests of ' + instances.length + ' ajv instances with different options',
  suites: testSuites(),
  assert: require('./chai').assert,
  afterError: function (res) {
    console.log('ajv options:', res.validator.opts);
  },
  // afterEach: function (res) {
  //   console.log(res.errors);
  // },
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
