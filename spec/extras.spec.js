'use strict';

var jsonSchemaTest = require('json-schema-test')
  , getAjvInstances = require('./ajv_instances')
  , options = require('./ajv_options')
  , suite = require('./browser_test_suite')
  , after = require('./after_test');

var instances = getAjvInstances(options, {
  $data: true,
  unknownFormats: ['allowedUnknown']
});


jsonSchemaTest(instances, {
  description: 'Extra keywords schemas tests of ' + instances.length + ' ajv instances with different options',
  suites: {
    'extras': typeof window == 'object'
              ? suite(require('./extras/{**/,}*.json', {mode: 'list'}))
              : './extras/{**/,}*.json'
  },
  assert: require('./chai').assert,
  afterError: after.error,
  afterEach: after.each,
  cwd: __dirname,
  hideFolder: 'extras/',
  timeout: 90000
});
