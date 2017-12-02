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
  'http://localhost:1234/name.json': require('./JSON-Schema-Test-Suite/remotes/name.json')
};

runTest(getAjvInstances(options, {meta: false, schemaId: 'id'}), 4, typeof window == 'object'
  ? suite(require('./JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json', {mode: 'list'}))
  : './JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json');

runTest(getAjvInstances(options, {meta: false, schemaId: 'auto', format: 'full'}), 6, typeof window == 'object'
  ? suite(require('./JSON-Schema-Test-Suite/tests/draft6/{**/,}*.json', {mode: 'list'}))
  : './JSON-Schema-Test-Suite/tests/draft6/{**/,}*.json');


function runTest(instances, draft, tests) {
  instances.forEach(function (ajv) {
    switch (draft) {
      case 4:
        ajv.addMetaSchema(require('../lib/refs/json-schema-draft-04.json'));
        ajv._opts.defaultMeta = 'http://json-schema.org/draft-04/schema#';
        break;
      case 6:
        ajv.addMetaSchema(require('../lib/refs/json-schema-draft-06.json'));
        ajv._opts.defaultMeta = 'http://json-schema.org/draft-06/schema#';
        break;
    }
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
    skip: ['optional/zeroTerminatedFloats'],
    assert: require('./chai').assert,
    afterError: after.error,
    afterEach: after.each,
    cwd: __dirname,
    hideFolder: 'draft' + draft + '/',
    timeout: 120000
  });
}
