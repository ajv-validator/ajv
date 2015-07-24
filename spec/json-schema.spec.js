'use strict';

var jsonSchemaTest = require('json-schema-test')
  , path = require('path');


var Ajv = require('../lib/ajv')
  , ajv = Ajv({ beautify: true, _debug: false })
  , fullAjv = Ajv({ allErrors: true, verbose: true, format: 'full', beautify: true, _debug: false });

var remoteRefs = {
    // for JSON-Schema-Test-Suite
    'http://localhost:1234/integer.json': require('./JSON-Schema-Test-Suite/remotes/integer.json'),
    'http://localhost:1234/subSchemas.json': require('./JSON-Schema-Test-Suite/remotes/subSchemas.json'),
    'http://localhost:1234/folder/folderInteger.json': require('./JSON-Schema-Test-Suite/remotes/folder/folderInteger.json'),
    // for tests
    'http://localhost:1234/name.json': require('./remotes/name.json')
};

var remoteRefsWithIds = [ // order is important
  require('./remotes/bar.json'),
  require('./remotes/foo.json'),
  require('./remotes/buu.json'),
];

addRemoteRefs();


jsonSchemaTest([ ajv, fullAjv ], {
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
  cwd: __dirname,
  hideFolder: 'draft4/'
});


function testSuites() {
  if (typeof window == 'object') {
    var suites = {
      'JSON-Schema tests draft4': require('./JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json', {mode: 'hash'}),
      'Advanced schema tests': require('./tests/{**/,}*.json', {mode: 'hash'})
    };
    for (var suiteName in suites) {
      var suite = suites[suiteName];
      var suiteArr = [];
      for (var testSetName in suite)
        suiteArr.push({ name: testSetName, test: suite[testSetName] });
      suites[suiteName] = suiteArr;
    }
  } else {
    var suites = {
      'JSON-Schema tests draft4': './JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json',
      'Advanced schema tests': './tests/{**/,}*.json'
    }
  }
  return suites;
}


function addRemoteRefs() {
  for (var id in remoteRefs) {
    ajv.addSchema(remoteRefs[id], id);
    fullAjv.addSchema(remoteRefs[id], id);
  }

  ajv.addSchema(remoteRefsWithIds);
  fullAjv.addSchema(remoteRefsWithIds);
}
