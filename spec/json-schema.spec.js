'use strict';

var fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , TESTS_PATH = 'JSON-Schema-Test-Suite/tests/draft4/';

var ONLY_RULES, SKIP_RULES;
// ONLY_RULES = [
// // 'type',
// // 'not',
// // 'allOf', 'anyOf',  'oneOf', 'enum',
// // 'maximum', 'minimum', 'multipleOf', 
// // 'maxLength', 'minLength', 'pattern',
// // 'properties', 'patternProperties', 'additionalProperties',
// // 'dependencies',
// // 'required',
// // 'maxProperties', 'minProperties', 'maxItems', 'minItems',
// // 'items', 'additionalItems',
// // 'uniqueItems',
// // 'optional/format', 'optional/bignum',
// 'ref'
// ];

SKIP_RULES = [
// 'refRemote',
'optional/zeroTerminatedFloats'
];


var Ajv = require('../lib/ajv')
  , ajv = Ajv()
  , fullAjv = Ajv({ allErrors: true, verbose: true });

var remoteRefs = {
    'http://localhost:1234/integer.json': require('../JSON-Schema-Test-Suite/remotes/integer.json'),
    'http://localhost:1234/subSchemas.json': require('../JSON-Schema-Test-Suite/remotes/subSchemas.json'),
    'http://localhost:1234/folder/folderInteger.json': require('../JSON-Schema-Test-Suite/remotes/folder/folderInteger.json')
};

for (var id in remoteRefs) {
  ajv.addSchema(remoteRefs[id], id);
  fullAjv.addSchema(remoteRefs[id], id);
}


describe('JSON-Schema tests', function () {
  var testsPath = path.join(__dirname, '..', TESTS_PATH);
  var files = getTestFilesRecursive(testsPath);

  files.forEach(function (file) {
    if (ONLY_RULES && ONLY_RULES.indexOf(file.name) == -1) return;
    if (SKIP_RULES && SKIP_RULES.indexOf(file.name) >= 0) return;

    describe(file.name, function() {
      var testSets = require(file.path);
      testSets.forEach(function (testSet) {
        // if (testSet.description != 'not') return;
        describe(testSet.description, function() {
        // it(testSet.description, function() {
          var validate = ajv.compile(testSet.schema);
          var fullValidate = fullAjv.compile(testSet.schema);

          testSet.tests.forEach(function (test) {
            // if (test.description != 'allowed') return;
            it(test.description, function() {
              var valid = validate(test.data);
              // console.log('result', result);
              assert.equal(valid, test.valid);
              if (valid) assert(validate.errors.length == 0);
              else assert(validate.errors.length > 0);

              var valid = fullValidate(test.data);
              // console.log('full result', result);
              assert.equal(valid, test.valid);
              if (valid) assert(validate.errors.length == 0);
              else assert(validate.errors.length > 0);
            });
          });
        });
      });
    });
  });
});


function getTestFilesRecursive(rootPath) {
  var list = fs.readdirSync(rootPath);
  var files = [];
  list.forEach(function (item) {
    var itemPath = path.join(rootPath, item);
    var stat = fs.statSync(itemPath);
    if (stat.isFile()) files.push({ name: path.basename(item, '.json'), path: itemPath });
    else if (stat.isDirectory()) {
      var _files = getTestFilesRecursive(itemPath);
      _files.forEach(function (f) {
        files.push({ name: path.join(item, f.name), path: f.path })
      });
    }
  });
  return files;
}
