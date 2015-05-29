'use strict';

var fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , TESTS_PATH = 'JSON-Schema-Test-Suite/tests/draft4/';

var ONLY_RULES;
// ONLY_RULES = ['enum'];
ONLY_RULES = [
'type', 'not', 'allOf', 'anyOf', 'oneOf', 'enum',
'maximum', 'minimum', 'multipleOf', 
'maxLength', 'minLength', 'pattern',
'properties', 'patternProperties', 'additionalProperties',
'required', 'maxProperties', 'minProperties',
'maxItems', 'minItems', 'items', 'additionalItems', 'uniqueItems'
];


var Jv = require('../lib/jv')
  , jv = Jv()
  , fullJv = Jv({ allErrors: true, verbose: true });

describe.only('JSON-Schema tests', function () {
  var testsPath = path.join(__dirname, '..', TESTS_PATH);
  var files = getTestFilesRecursive(testsPath);

  files.forEach(function (file) {
    if (ONLY_RULES && ONLY_RULES.indexOf(file.name) == -1) return;
    describe(file.name, function() {
      var testSets = require(file.path);
      testSets.forEach(function (testSet) {
        // if (testSet.description != 'additionalProperties can exist by itself') return;
        describe(testSet.description, function() {
        // it(testSet.description, function() {
          var validate = jv.compile(testSet.schema);
          var fullValidate = fullJv.compile(testSet.schema);

          testSet.tests.forEach(function (test) {
            // if (test.description != 'a single invalid match is invalid') return;
            it(test.description, function() {
              var result = validate(test.data);
              // console.log('result', result);
              assert.equal(result.valid, test.valid);
              if (result.valid) assert(result.errors.length == 0);
              else assert(result.errors.length > 0);

              var result = fullValidate(test.data);
              // console.log('full result', result);
              assert.equal(result.valid, test.valid);
              if (result.valid) assert(result.errors.length == 0);
              else assert(result.errors.length > 0);
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
