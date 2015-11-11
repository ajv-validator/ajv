'use strict';

var jsonSchemaTest = require('json-schema-test')
  , getAjvInstances = require('./ajv_instances');

var isBrowser = typeof window == 'object';

var fullTest = isBrowser || !process.env.AJV_FAST_TEST;
var instances = getAjvInstances(fullTest ? {
  beautify:     true,
  allErrors:    true,
  verbose:      true,
  format:       'full',
  inlineRefs:   false,
  jsonPointers: true,
  i18n:         true
} : { allErrors: true });

var remoteRefs = {
    // for JSON-Schema-Test-Suite
    'http://localhost:1234/integer.json': require('./JSON-Schema-Test-Suite/remotes/integer.json'),
    'http://localhost:1234/subSchemas.json': require('./JSON-Schema-Test-Suite/remotes/subSchemas.json'),
    'http://localhost:1234/folder/folderInteger.json': require('./JSON-Schema-Test-Suite/remotes/folder/folderInteger.json'),
    // for tests
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
  suites: testSuites(),
  only: [
    // 'type', 'not', 'allOf', 'anyOf', 'oneOf', 'enum',
    // 'maximum', 'minimum', 'multipleOf', 'maxLength', 'minLength', 'pattern',
    // 'properties', 'patternProperties', 'additionalProperties',
    // 'dependencies', 'required',
    // 'maxProperties', 'minProperties', 'maxItems', 'minItems',
    // 'items', 'additionalItems', 'uniqueItems',
    // 'optional/format', 'optional/bignum',
    // 'ref', 'refRemote', 'definitions',
    // 'schemas/complex', 'schemas/basic', 'schemas/advanced',
  ],
  skip: [
    'optional/zeroTerminatedFloats'
  ],
  afterError: function (res) {
    console.log('ajv options:', res.validator.opts);
  },
  cwd: __dirname,
  hideFolder: 'draft4/',
  timeout: 90000
});


function testSuites() {
  if (typeof window == 'object') {
    var suites = {
      'JSON-Schema tests draft4': require('./JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json', {mode: 'list'}),
      'Advanced schema tests': require('./tests/{**/,}*.json', {mode: 'list'})
    };
    for (var suiteName in suites) {
      suites[suiteName].forEach(function (suite) {
        suite.test = suite.module;
      });
    }
  } else {
    var suites = {
      'JSON-Schema tests draft4': './JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json',
      'Advanced schema tests': './tests/{**/,}*.json'
    }
  }
  return suites;
}


function addRemoteRefs(ajv) {
  for (var id in remoteRefs) ajv.addSchema(remoteRefs[id], id);
  ajv.addSchema(remoteRefsWithIds);
}
