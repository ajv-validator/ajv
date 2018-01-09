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

var SKIP = {
  4: ['optional/zeroTerminatedFloats'],
  7: [
    'optional/content',
    'format/idn-email',
    'format/idn-hostname',
    'format/iri',
    'format/iri-reference'
  ]
};


runTest(getAjvInstances(options, {meta: false, schemaId: 'id'}), 4, typeof window == 'object'
  ? suite(require('./JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json', {mode: 'list'}))
  : './JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json');

runTest(getAjvInstances(options, {meta: false}), 6, typeof window == 'object'
  ? suite(require('./JSON-Schema-Test-Suite/tests/draft6/{**/,}*.json', {mode: 'list'}))
  : './JSON-Schema-Test-Suite/tests/draft6/{**/,}*.json');

runTest(getAjvInstances(options), 7, typeof window == 'object'
  ? suite(require('./JSON-Schema-Test-Suite/tests/draft7/{**/,}*.json', {mode: 'list'}))
  : './JSON-Schema-Test-Suite/tests/draft7/{**/,}*.json');


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
    only: [],
    skip: SKIP[draft],
    assert: require('./chai').assert,
    afterError: after.error,
    afterEach: after.each,
    cwd: __dirname,
    hideFolder: 'draft' + draft + '/',
    timeout: 120000
  });
}
