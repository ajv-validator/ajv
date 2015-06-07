'use strict';

var glob = require('glob')
  , path = require('path')
  , assert = require('assert');

var ONLY_RULES, SKIP_RULES;
// ONLY_RULES = [
// 'type', 'not', 'allOf', 'anyOf', 'oneOf', 'enum',
// 'maximum', 'minimum', 'multipleOf', 'maxLength', 'minLength', 'pattern',
// 'properties', 'patternProperties', 'additionalProperties',
// 'dependencies', 'required',
// 'maxProperties', 'minProperties', 'maxItems', 'minItems',
// 'items', 'additionalItems', 'uniqueItems',
// 'optional/format', 'optional/bignum',
// 'ref',
// 'definitions'
// 'schemas/complex'
// ];

SKIP_RULES = [
  'refRemote',
  'optional/zeroTerminatedFloats',
  'schemas/complex'
];


var Ajv = require('../lib/ajv')
  , ajv = Ajv()
  , fullAjv = Ajv({ allErrors: true, verbose: true });

var remoteRefs = {
    'http://localhost:1234/integer.json': require('./JSON-Schema-Test-Suite/remotes/integer.json'),
    'http://localhost:1234/subSchemas.json': require('./JSON-Schema-Test-Suite/remotes/subSchemas.json'),
    'http://localhost:1234/folder/folderInteger.json': require('./JSON-Schema-Test-Suite/remotes/folder/folderInteger.json')
};

for (var id in remoteRefs) {
  ajv.addSchema(remoteRefs[id], id);
  fullAjv.addSchema(remoteRefs[id], id);
}


addTests('JSON-Schema tests draft4', './json-schema-test-suite/tests/draft4/{**/,}*.json');
addTests('Advanced schema tests', './tests/{**/,}*.json');


function addTests(description, testsPath) {
  describe(description, function() {
    var files = getTestFiles(testsPath);

    files.forEach(function (file) {
      var skip = (ONLY_RULES && ONLY_RULES.indexOf(file.name) == -1) ||
                 (SKIP_RULES && SKIP_RULES.indexOf(file.name) >= 0);
      if (skip) return;

      (skip ? describe.skip : describe) (file.name, function() {
        var testSets = require(file.path);
        testSets.forEach(function (testSet) {
          // if (testSet.description != 'allOf with base schema') return;
          describe(testSet.description, function() {
            var validate, fullValidate;
          // it(testSet.description, function() {
            before(function() {
              validate = ajv.compile(testSet.schema);
              fullValidate = fullAjv.compile(testSet.schema);
            });

            testSet.tests.forEach(function (test) {
              // if (test.description != 'one supplementary Unicode code point is not long enough') return;
              // console.log(testSet.schema, '\n\n***\n\n', validate.toString());
              it(test.description, function() {
                var valid = validate(test.data);
                // console.log('result', valid, validate.errors);
                assert.equal(valid, test.valid);
                if (valid) assert(validate.errors.length == 0);
                else assert(validate.errors.length > 0);

                var valid = fullValidate(test.data);
                // console.log('full result', valid, fullValidate.errors);
                assert.equal(valid, test.valid);
                if (valid) assert(fullValidate.errors.length == 0);
                else assert(fullValidate.errors.length > 0);
              });
            });
          });
        });
      });
    });
  });
}


function getTestFiles(testsPath) {
  var files = glob.sync(testsPath, { cwd: __dirname });
  return files.map(function (file) {
    var match = file.match(/(\w+\/)\w+\.json/)
    var folder = match ? match[1] : '';
    if (folder == 'draft4/') folder = '';
    return { path: file, name: folder + path.basename(file, '.json') };
  });
}
