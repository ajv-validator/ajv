'use strict';

var fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , TESTS_PATH = 'JSON-Schema-Test-Suite/tests/draft4/';

var ONLY_RULES;
ONLY_RULES = ['type'];


var jv = require('../lib/jv')();

describe.only('JSON-Schema tests', function (done) {
  var testsPath = path.join(__dirname, '..', TESTS_PATH);
  var files = getTestFilesRecursive(testsPath);

  files.forEach(function (file) {
    if (ONLY_RULES && ONLY_RULES.indexOf(file.name) == -1) return;
    describe(file.name, function() {
      var testSets = require(file.path);
      testSets.forEach(function (testSet) {
        describe(testSet.description, function() {
          var validate;
          before(function() {
            validate = jv.compile(testSet.schema);
          });

          testSet.tests.forEach(function (test) {
            // if (test.description != 'an integer is valid') return;
            it(test.description, function() {
              var result = validate(test.data);
              assert.equal(result.valid, test.valid);
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
