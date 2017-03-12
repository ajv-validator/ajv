'use strict';

var jsonSchemaTest = require('json-schema-test')
  , getAjvInstances = require('./ajv_instances')
  , options = require('./ajv_options')
  , suite = require('./browser_test_suite')
  , after = require('./after_test');

var remoteRefs = {
  'http://localhost:1234/integer.json': require('./JSON-Schema-Test-Suite/remotes/integer.json'),
  'http://localhost:1234/subSchemas.json': require('./JSON-Schema-Test-Suite/remotes/subSchemas.json'),
  'http://localhost:1234/folder/folderInteger.json': require('./JSON-Schema-Test-Suite/remotes/folder/folderInteger.json'),
};

runTest(getAjvInstances(options, {meta: false}), 4, typeof window == 'object'
  ? suite(require('./JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json', {mode: 'list'}))
  : './JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json');

runTest(getAjvInstances(options), 6, typeof window == 'object'
  ? suite(require('./JSON-Schema-Test-Suite/tests/draft6/{**/,}*.json', {mode: 'list'}))
  : './JSON-Schema-Test-Suite/tests/draft6/{**/,}*.json');


function runTest(instances, draft, tests) {
  instances.forEach(function (ajv) {
    ajv.addMetaSchema(require('../lib/refs/json-schema-draft-04.json'));
    if (draft == 4) ajv._opts.defaultMeta = 'http://json-schema.org/draft-04/schema#';
    for (var id in remoteRefs) ajv.addSchema(remoteRefs[id], id);
  });

  jsonSchemaTest(instances, {
    description: 'JSON-Schema Test Suite draft-0' + draft + ': ' + instances.length + ' ajv instances with different options',
    suites: {tests: tests},
    only: [
      // 'type', 'not', 'allOf', 'anyOf', 'oneOf', 'enum',
      // 'maximum', 'minimum', 'multipleOf', 'maxLength', 'minLength', 'pattern',
      // 'properties', 'patternProperties', 'additionalProperties',
      // 'dependencies', 'required',
      // 'maxProperties', 'minProperties', 'maxItems', 'minItems',
      // 'items', 'additionalItems', 'uniqueItems',
      // 'optional/format', 'optional/bignum',
      // 'ref', 'refRemote', 'definitions',
    ],
    skip: [ 'optional/zeroTerminatedFloats', 'optional/bignum' ],
    assert: require('./chai').assert,
    afterError: after.error,
    afterEach: after.each,
    cwd: __dirname,
    hideFolder: 'draft' + draft + '/',
    timeout: 120000
  });
}
