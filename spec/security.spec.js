'use strict';

var jsonSchemaTest = require('json-schema-test')
  , getAjvInstances = require('./ajv_instances')
  , options = require('./ajv_options')
  , suite = require('./browser_test_suite')
  , after = require('./after_test');

var instances = getAjvInstances(options, {
  schemas: [require('../lib/refs/json-schema-secure.json')]
});


jsonSchemaTest(instances, {
  description: 'Secure schemas tests of ' + instances.length + ' ajv instances with different options',
  suites: {
    'security': typeof window == 'object'
              ? suite(require('./security/{**/,}*.json', {mode: 'list'}))
              : './security/{**/,}*.json'
  },
  assert: require('./chai').assert,
  afterError: after.error,
  afterEach: after.each,
  cwd: __dirname,
  hideFolder: 'security/',
  timeout: 90000
});
