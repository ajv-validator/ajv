'use strict';

var jsonSchemaTest = require('json-schema-test')
  , getAjvInstances = require('./ajv_instances')
  , options = require('./ajv_options')
  , suite = require('./brower_test_suite')
  , after = require('./after_test');

var instances = getAjvInstances(options, { v5: true, unknownFormats: ['allowedUnknown'] });


jsonSchemaTest(instances, {
  description: 'v5 schemas tests of ' + instances.length + ' ajv instances with different options',
  suites: {
    'v5 proposals': typeof window == 'object'
                    ? suite(require('./v5/{**/,}*.json', {mode: 'list'}))
                    : './v5/{**/,}*.json'
  },
  assert: require('./chai').assert,
  afterError: after.error,
  afterEach: after.each,
  cwd: __dirname,
  hideFolder: 'v5/',
  timeout: 90000
});
