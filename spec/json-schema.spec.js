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

var instances4 = getAjvInstances(options, {meta: false});
instances4.forEach(function (ajv) {
  addRemoteRefs(ajv);
  ajv._opts.defaultMeta = 'http://json-schema.org/draft-04/schema#';
});

runTest(instances4, 4, typeof window == 'object'
  ? suite(require('./JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json', {mode: 'list'}))
  : './JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json');

var instances6 = getAjvInstances(options);
instances6.forEach(addRemoteRefs);

runTest(instances6, 6, typeof window == 'object'
  ? suite(require('./JSON-Schema-Test-Suite/tests/draft6/{**/,}*.json', {mode: 'list'}))
  : './JSON-Schema-Test-Suite/tests/draft6/{**/,}*.json');


function runTest(instances, draft, tests) {
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


function addRemoteRefs(ajv) {
  ajv.addMetaSchema(require('../lib/refs/json-schema-draft-04.json'));
  for (var id in remoteRefs) ajv.addSchema(remoteRefs[id], id);
}
