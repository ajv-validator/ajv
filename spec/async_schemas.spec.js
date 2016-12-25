'use strict';

var jsonSchemaTest = require('json-schema-test')
  , Promise = require('./promise')
  , getAjvInstances = require('./ajv_async_instances')
  , Ajv = require('./ajv')
  , suite = require('./browser_test_suite')
  , after = require('./after_test');


var instances = getAjvInstances({ $data: true });


instances.forEach(addAsyncFormatsAndKeywords);


jsonSchemaTest(instances, {
  description: 'asynchronous schemas tests of ' + instances.length + ' ajv instances with different options',
  suites: {
    'async schemas':
      typeof window == 'object'
      ? suite(require('./async/{**/,}*.json', {mode: 'list'}))
      : './async/{**/,}*.json'
  },
  async: true,
  asyncValid: 'data',
  assert: require('./chai').assert,
  Promise: Promise,
  afterError: after.error,
  // afterEach: after.each,
  cwd: __dirname,
  hideFolder: 'async/',
  timeout: 90000
});


function addAsyncFormatsAndKeywords (ajv) {
  ajv.addFormat('english_word', {
    async: true,
    validate: checkWordOnServer
  });

  ajv.addKeyword('idExists', {
    async: true,
    type: 'number',
    validate: checkIdExists,
    errors: false
  });

  ajv.addKeyword('idExistsWithError', {
    async: true,
    type: 'number',
    validate: checkIdExistsWithError,
    errors: true
  });

  ajv.addKeyword('idExistsCompiled', {
    async: true,
    type: 'number',
    compile: compileCheckIdExists
  });
}


function checkWordOnServer(str) {
  return str == 'tomorrow' ? Promise.resolve(true)
          : str == 'manana' ? Promise.resolve(false)
          : Promise.reject(new Error('unknown word'));
}


function checkIdExists(schema, data) {
  switch (schema.table) {
    case 'users': return check([1, 5, 8]);
    case 'posts': return check([21, 25, 28]);
    default: throw new Error('no such table');
  }

  function check(IDs) {
    return Promise.resolve(IDs.indexOf(data) >= 0);
  }
}


function checkIdExistsWithError(schema, data) {
  var table = schema.table;
  switch (table) {
    case 'users': return check(table, [1, 5, 8]);
    case 'posts': return check(table, [21, 25, 28]);
    default: throw new Error('no such table');
  }

  function check(_table, IDs) {
    if (IDs.indexOf(data) >= 0)
      return Promise.resolve(true);

    var error = {
      keyword: 'idExistsWithError',
      message: 'id not found in table ' + _table
    };
    return Promise.reject(new Ajv.ValidationError([error]));
  }
}


function compileCheckIdExists(schema) {
  switch (schema.table) {
    case 'users': return compileCheck([1, 5, 8]);
    case 'posts': return compileCheck([21, 25, 28]);
    default: throw new Error('no such table');
  }

  function compileCheck(IDs) {
    return function (data) {
      return Promise.resolve(IDs.indexOf(data) >= 0);
    };
  }
}
