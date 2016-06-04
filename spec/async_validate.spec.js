'use strict';

var Ajv = require('./ajv')
  , Promise = require('./promise')
  , getAjvInstances = require('./ajv_async_instances')
  , should = require('./chai').should()
  , co = require('co');


describe('async schemas, formats and keywords', function() {
  this.timeout(30000);
  var ajv, instances;

  beforeEach(function () {
    instances = getAjvInstances();
    ajv = instances[0];
  });

  function useCo(ajv) {
    var async = ajv._opts.async;
    return async == 'es7' || async == 'co*' ? identity : co;
  }

  function identity(x) { return x; }

  describe('async schemas without async elements', function() {
    it('should return result as promise', function() {
      var schema = {
        $async: true,
        type: 'string',
        maxLength: 3
      };

      return repeat(function() { return Promise.map(instances, test); });

      function test(ajv) {
        var validate = ajv.compile(schema);
        var _co = useCo(ajv);

        return Promise.all([
          shouldBeValid(   _co(validate('abc')) ),
          shouldBeInvalid( _co(validate('abcd')) ),
          shouldBeInvalid( _co(validate(1)) ),
        ]);
      }
    });

    it('should fail compilation if async schema is inside sync schema', function() {
      var schema = {
        properties: {
          foo: {
            $async: true,
            type: 'string',
            maxLength: 3
          }
        }
      };

      shouldThrowFunc('async schema in sync schema', function() {
        ajv.compile(schema);
      });

      schema.$async = true;

      ajv.compile(schema);
    });
  });


  describe('async formats', function() {
    beforeEach(addFormatEnglishWord);


    it('should fail compilation if async format is inside sync schema', function() {
      instances.forEach(function (ajv) {
        var schema = {
          type: 'string',
          format: 'english_word'
        };

        shouldThrowFunc('async format in sync schema', function() {
          ajv.compile(schema);
        })
        schema.$async = true;
        ajv.compile(schema);
      });
    });
  });


  describe('async custom keywords', function() {
    beforeEach(function() {
      instances.forEach(function (ajv) {
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
      });
    });


    it('should fail compilation if async keyword is inside sync schema', function() {
      instances.forEach(function (ajv) {
        var schema = {
          type: 'object',
          properties: {
            userId: {
              type: 'integer',
              idExists: { table: 'users' }
            }
          }
        };

        shouldThrowFunc('async keyword in sync schema', function() {
          ajv.compile(schema);
        })

        schema.$async = true;
        ajv.compile(schema);
      });
    });


    it('should return custom error', function() {
      return Promise.all(instances.map(function (ajv) {
        var schema = {
          $async: true,
          type: 'object',
          properties: {
            userId: {
              type: 'integer',
              idExistsWithError: { table: 'users' }
            },
            postId: {
              type: 'integer',
              idExistsWithError: { table: 'posts' }
            }
          }
        };

        var validate = ajv.compile(schema);
        var _co = useCo(ajv);

        return Promise.all([
          shouldBeInvalid(_co(validate({ userId: 5, postId: 10 })), [ 'id not found in table posts' ]),
          shouldBeInvalid(_co(validate({ userId: 9, postId: 25 })), [ 'id not found in table users' ])
        ]);
      }));
    });


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

      function check(table, IDs) {
        if (IDs.indexOf(data) >= 0) {
          return Promise.resolve(true);
        } else {
          var error = {
            keyword: 'idExistsWithError',
            message: 'id not found in table ' + table
          };
          return Promise.reject(new Ajv.ValidationError([error]));
        }
      }
    }
  });


  describe('async referenced schemas', function() {
    beforeEach(function() {
      instances = getAjvInstances({ inlineRefs: false });
      addFormatEnglishWord();
    });

    it('should validate referenced async schema', function() {
      var schema = {
        $async: true,
        definitions: {
          english_word: {
            $async: true,
            type: 'string',
            format: 'english_word'
          }
        },
        properties: {
          word: { $ref: '#/definitions/english_word' }
        }
      };

      return repeat(function() { return Promise.map(instances, function (ajv) {
        var validate = ajv.compile(schema);
        var _co = useCo(ajv);

        return Promise.all([
          shouldBeValid(   _co(validate({ word: 'tomorrow' })) ),
          shouldBeInvalid( _co(validate({ word: 'manana' })) ),
          shouldBeInvalid( _co(validate({ word: 1 })) ),
          shouldThrow(     _co(validate({ word: 'today' })), 'unknown word' )
        ]);
      }); });
    });

    it('should validate recursive async schema', function() {
      var schema = {
        $async: true,
        definitions: {
          english_word: {
            $async: true,
            type: 'string',
            format: 'english_word'
          }
        },
        type: 'object',
        properties: {
          foo: {
            anyOf: [
              { $ref: '#/definitions/english_word' },
              { $ref: '#' }
            ]
          }
        }
      };

      return recursiveTest(schema);
    });

    it('should validate ref from referenced async schema to root schema', function() {
      var schema = {
        $async: true,
        definitions: {
          wordOrRoot: {
            $async: true,
            anyOf: [
              {
                type: 'string',
                format: 'english_word'
              },
              { $ref: '#' }
            ]
          }
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/wordOrRoot' }
        }
      };

      return recursiveTest(schema);
    });

    it('should validate refs between two async schemas', function() {
      var schemaObj = {
        id: 'http://e.com/obj.json#',
        $async: true,
        type: 'object',
        properties: {
          foo: { $ref: 'http://e.com/word.json#' }
        }
      };

      var schemaWord = {
        id: 'http://e.com/word.json#',
        $async: true,
        anyOf: [
          {
            type: 'string',
            format: 'english_word'
          },
          { $ref: 'http://e.com/obj.json#' }
        ]
      };

      return recursiveTest(schemaObj, schemaWord);
    });

    it('should fail compilation if sync schema references async schema', function() {
      var schema = {
        id: 'http://e.com/obj.json#',
        type: 'object',
        properties: {
          foo: { $ref: 'http://e.com/word.json#' }
        }
      };

      var schemaWord = {
        id: 'http://e.com/word.json#',
        $async: true,
        anyOf: [
          {
            type: 'string',
            format: 'english_word'
          },
          { $ref: 'http://e.com/obj.json#' }
        ]
      };

      ajv.addSchema(schemaWord);
      shouldThrowFunc('async schema referenced by sync schema', function() {
        ajv.compile(schema);
      });

      schema.id = 'http://e.com/obj2.json#';
      schema.$async = true;

      ajv.compile(schema);
    });

    function recursiveTest(schema, refSchema) {
      return repeat(function() { return Promise.map(instances, function (ajv) {
        if (refSchema) try { ajv.addSchema(refSchema); } catch(e) {};
        var validate = ajv.compile(schema);
        var _co = useCo(ajv);

        return Promise.all([
          shouldBeValid(   _co(validate({ foo: 'tomorrow' })) ),
          shouldBeInvalid( _co(validate({ foo: 'manana' })) ),
          shouldBeInvalid( _co(validate({ foo: 1 })) ),
          shouldThrow(     _co(validate({ foo: 'today' })), 'unknown word' ),
          shouldBeValid(   _co(validate({ foo: { foo: 'tomorrow' }})) ),
          shouldBeInvalid( _co(validate({ foo: { foo: 'manana' }})) ),
          shouldBeInvalid( _co(validate({ foo: { foo: 1 }})) ),
          shouldThrow(     _co(validate({ foo: { foo: 'today' }})), 'unknown word' ),
          shouldBeValid(   _co(validate({ foo: { foo: { foo: 'tomorrow' }}})) ),
          shouldBeInvalid( _co(validate({ foo: { foo: { foo: 'manana' }}})) ),
          shouldBeInvalid( _co(validate({ foo: { foo: { foo: 1 }}})) ),
          shouldThrow(     _co(validate({ foo: { foo: { foo: 'today' }}})), 'unknown word' )
        ]);
      }); });
    }
  });


  function addFormatEnglishWord() {
    instances.forEach(function (ajv) {
      ajv.addFormat('english_word', {
        async: true,
        validate: checkWordOnServer
      });
    });
  }
});


describe('async/transpile option', function() {
  it('should throw error with unknown async option', function() {
    shouldThrowFunc('bad async mode: es8', function() {
      new Ajv({ async: 'es8' });
    });
  });


  it('should throw error with unknown transpile option', function() {
    shouldThrowFunc('bad transpiler: babel', function() {
      new Ajv({ transpile: 'babel' });
    });

    shouldThrowFunc('bad transpiler: [object Object]', function() {
      new Ajv({ transpile: {} });
    });
  });


  it('should set async option to es7 if tranpiler is nodent', function() {
    var ajv1 = new Ajv({ transpile: 'nodent' });
    ajv1._opts.async .should.equal('es7');

    var ajv2 = new Ajv({ async: '*', transpile: 'nodent' });
    ajv2._opts.async .should.equal('es7');
  });
});


function checkWordOnServer(str) {
  return str == 'tomorrow' ? Promise.resolve(true)
          : str == 'manana' ? Promise.resolve(false)
          : Promise.reject(new Error('unknown word'));
}


function shouldThrowFunc(message, func) {
    var err;
    should.throw(function() {
      try { func(); }
      catch(e) { err = e; throw e; }
    });

    err.message .should.equal(message);
}


function shouldBeValid(p) {
  return p.then(function (valid) {
    valid .should.equal(true);
  });
}


var SHOULD_BE_INVALID = 'test: should be invalid';
function shouldBeInvalid(p, expectedMessages) {
  return checkNotValid(p)
  .then(function (err) {
    err .should.be.instanceof(Ajv.ValidationError);
    err.errors .should.be.an('array');
    err.validation .should.equal(true);
    if (expectedMessages) {
      var messages = err.errors.map(function (e) {
        return e.message;
      });
      messages .should.eql(expectedMessages);
    }
  });
}


function shouldThrow(p, exception) {
  return checkNotValid(p)
  .then(function (err) {
    err.message .should.equal(exception);
  });
}


function checkNotValid(p) {
  return p.then(function (valid) {
    throw new Error(SHOULD_BE_INVALID);
  })
  .catch(function (err) {
    err. should.be.instanceof(Error);
    if (err.message == SHOULD_BE_INVALID) throw err;
    return err;
  });  
}


function repeat(func) {
  return func();
  // var promises = [];
  // for (var i=0; i<1000; i++) promises.push(func());
  // return Promise.all(promises);
}
