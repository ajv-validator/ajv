'use strict';

var jsonSchemaTest = require('json-schema-test')
  , path = require('path')
  , util = require('../lib/compile/util');


var Ajv = require(typeof window == 'object' ? 'ajv' : '../lib/ajv');

var instances = getAjvInstances({
  beautify:     true,
  allErrors:    true,
  verbose:      true,
  format:       'full',
  inlineRefs:   false,
  jsonPointers: true
});

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
  require('./remotes/tree.json'),
  require('./remotes/node.json'),
  require('./remotes/second.json'),
  require('./remotes/first.json'),
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
  cwd: __dirname,
  hideFolder: 'draft4/',
  timeout: 60000
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


function getAjvInstances(options) {
  return _getAjvInstances(options, {})
}

function _getAjvInstances(opts, useOpts) {
  var optNames = Object.keys(opts);
  if (optNames.length) {
    opts = util.copy(opts);
    var useOpts1 = util.copy(useOpts)
      , optName = optNames[0];
    useOpts1[optName] = opts[optName];
    delete opts[optName];
    var instances = _getAjvInstances(opts, useOpts)
      , instances1 = _getAjvInstances(opts, useOpts1);
    return instances.concat(instances1);
  } else return [ Ajv(useOpts) ];
}

function addRemoteRefs(ajv) {
  for (var id in remoteRefs) {
    ajv.addSchema(remoteRefs[id], id);
  }

  ajv.addSchema(remoteRefsWithIds);
}
