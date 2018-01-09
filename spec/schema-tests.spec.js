'use strict';

var jsonSchemaTest = require('json-schema-test')
  , getAjvInstances = require('./ajv_instances')
  , options = require('./ajv_options')
  , suite = require('./browser_test_suite')
  , after = require('./after_test');

var instances = getAjvInstances(options, {unknownFormats: ['allowedUnknown']});

var remoteRefs = {
  'http://localhost:1234/integer.json': require('./JSON-Schema-Test-Suite/remotes/integer.json'),
  'http://localhost:1234/folder/folderInteger.json': require('./JSON-Schema-Test-Suite/remotes/folder/folderInteger.json'),
  'http://localhost:1234/name.json': require('./remotes/name.json')
};

var remoteRefsWithIds = [
  require('./remotes/bar.json'),
  require('./remotes/foo.json'),
  require('./remotes/buu.json'),
  require('./remotes/tree.json'),
  require('./remotes/node.json'),
  require('./remotes/second.json'),
  require('./remotes/first.json'),
  require('./remotes/scope_change.json'),
];

instances.forEach(addRemoteRefs);


jsonSchemaTest(instances, {
  description: 'Schema tests of ' + instances.length + ' ajv instances with different options',
  suites: {
    'Advanced schema tests':
      typeof window == 'object'
      ? suite(require('./tests/{**/,}*.json', {mode: 'list'}))
      : './tests/{**/,}*.json'
  },
  only: [],
  assert: require('./chai').assert,
  afterError: after.error,
  afterEach: after.each,
  cwd: __dirname,
  timeout: 120000
});


function addRemoteRefs(ajv) {
  for (var id in remoteRefs) ajv.addSchema(remoteRefs[id], id);
  ajv.addSchema(remoteRefsWithIds);
}
