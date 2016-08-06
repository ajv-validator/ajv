'use strict';

var jsonSchemaTest = require('json-schema-test')
  , getAjvInstances = require('./ajv_instances')
  , options = require('./ajv_options')
  , should = require('./chai').should();

var instances = getAjvInstances(options);

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
  assert: require('./chai').assert,
  afterError: function (res) {
    console.log('ajv options:', res.validator._opts);
  },
  afterEach: function (res) {
    // console.log(res.errors);
    res.valid .should.be.a('boolean');
    if (res.valid === true ) {
      should.equal(res.errors, null);
    } else {
      res.errors .should.be.an('array');
      for (var i=0; i<res.errors.length; i++)
        res.errors[i] .should.be.an('object');
    }
  },
  cwd: __dirname,
  hideFolder: 'draft4/',
  timeout: 120000
});


function testSuites() {
  var suites;
  if (typeof window == 'object') {
    suites = {
      'JSON-Schema tests draft4': require('./JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json', {mode: 'list'}),
      'Advanced schema tests': require('./tests/{**/,}*.json', {mode: 'list'})
    };
    for (var suiteName in suites) {
      suites[suiteName].forEach(function (suite) {
        suite.test = suite.module;
      });
    }
  } else {
    suites = {
      'JSON-Schema tests draft4': './JSON-Schema-Test-Suite/tests/draft4/{**/,}*.json',
      'Advanced schema tests': './tests/{**/,}*.json'
    };
  }
  return suites;
}


function addRemoteRefs(ajv) {
  for (var id in remoteRefs) ajv.addSchema(remoteRefs[id], id);
  ajv.addSchema(remoteRefsWithIds);
}
