'use strict';

var jsonSchemaTest = require('json-schema-test')
  , getAjvInstances = require('./ajv_instances')
  , options = require('./ajv_options')
  , suite = require('./brower_test_suite')
  , after = require('./after_test');

var instances = getAjvInstances(options);

var remoteRefs = {
  'http://localhost:1234/integer.json': require('./JSON-Schema-Test-Suite/remotes/integer.json'),
  'http://localhost:1234/subSchemas.json': require('./JSON-Schema-Test-Suite/remotes/subSchemas.json'),
  'http://localhost:1234/folder/folderInteger.json': require('./JSON-Schema-Test-Suite/remotes/folder/folderInteger.json'),
};

instances.forEach(addRemoteRefs);


jsonSchemaTest(instances, {
  description: 'JSON-Schema Test Suite: ' + instances.length + ' ajv instances with different options',
  suites: {
    'JSON-Schema tests draft4':
      typeof window == 'object'
      ? suite(require('./JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json', {mode: 'list'}))
      : './JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json'
  },
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
  skip: [ 'optional/zeroTerminatedFloats' ],
  assert: require('./chai').assert,
  afterError: after.error,
  afterEach: after.each,
  cwd: __dirname,
  hideFolder: 'draft4/',
  timeout: 120000
});


function addRemoteRefs(ajv) {
  for (var id in remoteRefs) ajv.addSchema(remoteRefs[id], id);
}
