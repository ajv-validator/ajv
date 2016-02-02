'use strict';

var Ajv = require('./ajv')
  , should = require('./chai').should()
  , co = require('co')
  , Promise = require('bluebird')
  , util = require('../lib/compile/util');

Promise.config({ warnings: false });

var g = typeof global == 'object' ? global :
        typeof window == 'object' ? window : this;

g.Promise = g.Promise || Promise;

var isBrowser = typeof window == 'object';
var fullTest = isBrowser || !process.env.AJV_FAST_TEST;


describe('async schemas, formats and keywords', function() {
  this.timeout(10000);
  var ajv, instances;

  beforeEach(function () {
    getInstances();
    ajv = instances[0];
  });

  function getInstances(opts) {
    opts = opts || {};
    var firstTime = instances === undefined;
    instances = [];
    var options = [
      {},
      { async: true },
      { async: 'co*' },
      { async: 'es7' },
      { async: 'es7', transpile: 'nodent' },
      { async: '*', transpile: 'regenerator' },
      { async: 'co*', allErrors: true },
      { async: 'es7', allErrors: true },
      { async: 'es7', transpile: 'nodent', allErrors: true },
      { async: '*', transpile: 'regenerator', allErrors: true },
    ];

    if (fullTest) options.concat([
      { async: '*' },
      { transpile: 'regenerator' },
      { async: true, transpile: 'regenerator' },
      { async: 'co*', transpile: 'regenerator' },
      { async: 'es7', transpile: 'regenerator' },
      { allErrors: true },
      { async: true, allErrors: true },
      { async: '*', allErrors: true },
      { transpile: 'regenerator', allErrors: true },
      { async: true, transpile: 'regenerator', allErrors: true },
      { async: 'co*', transpile: 'regenerator', allErrors: true },
      { async: 'es7', transpile: 'regenerator', allErrors: true }
    ]);

    // options = options.filter(function (_opts) {
    //   return _opts.transpile == 'nodent';
    // });

    // var i = 10, repeatOptions = [];
    // while (i--) repeatOptions = repeatOptions.concat(options);
    // options = repeatOptions;

    options.forEach(function (_opts) {
      util.copy(opts, _opts);
      var ajv = getAjv(_opts);
      if (ajv) instances.push(ajv);
    });


    if (firstTime) {
      var asyncModes = [];
      instances.forEach(function (ajv) {
        if (!ajv._opts.async) return;
        var t = ajv._opts.transpile;
        var mode = ajv._opts.async + (t === true ? '' : '.' + t);
        if (asyncModes.indexOf(mode) == -1) asyncModes.push(mode);
      });
      console.log('Testing', instances.length, 'ajv instances:', asyncModes.join(','));
    }
  }

  function regeneratorTranspile(code) {
    return regenerator.compile(code).code;
  }

  function getAjv(opts){
    try { return Ajv(opts); } catch(e) {}
  }

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
          shouldBeInvalid( _co(validate(1)) )
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

    it('should return promise that resolves as true or rejects with array of errors', function() {
      var schema = {
        $async: true,
        type: 'string',
        format: 'english_word'
      };

      return repeat(function() { return Promise.map(instances, test); });

      function test(ajv) {
        var validate = ajv.compile(schema);
        var _co = useCo(ajv);

        return Promise.all([
          shouldBeValid(   _co(validate('tomorrow')) ),
          shouldBeInvalid( _co(validate('manana')) ),
          shouldBeInvalid( _co(validate(1)) ),
          shouldThrow(     _co(validate('today')), 'unknown word' )
        ]);
      }
    });


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


    it('should support async formats when $data ref resolves to async format name', function() {
      getInstances({ v5: true });
      addFormatEnglishWord();

      var schema = {
        $async: true,
        additionalProperties: {
          type: 'string',
          format: { $data: '0#' }
        }
      };

      return repeat(function() { return Promise.map(instances, test); });

      function test(ajv, index) {
        var validate = ajv.compile(schema);
        var _co = useCo(ajv);

        return Promise.all([
          shouldBeValid(   _co(validate({ english_word: 'tomorrow' })) ),
          shouldBeInvalid( _co(validate({ english_word: 'manana' })) ),
          shouldBeInvalid( _co(validate({ english_word: 1 })) ),
          shouldThrow(     _co(validate({ english_word: 'today' })), 'unknown word' ),

          shouldBeValid(   _co(validate({ date: '2016-01-25' })) ),
          shouldBeInvalid( _co(validate({ date: '01/25/2016' })) ),
          shouldBeInvalid( _co(validate({ date: 1 })) ),
        ]);
      }
    });
  });


  describe('async custom keywords', function() {
    beforeEach(function() {
      instances.forEach(function (ajv) {
        ajv.addKeyword('idExists', {
          async: true,
          type: 'number',
          validate: checkIdExists
        });

        ajv.addKeyword('idExistsCompiled', {
          async: true,
          type: 'number',
          compile: compileCheckIdExists
        });
      });
    });


    it('should validate custom keyword that returns promise', function() {
      var schema1 = {
        $async: true,
        properties: {
          userId: {
            type: 'integer',
            idExists: { table: 'users' }
          },
          postId: {
            type: 'integer',
            idExists: { table: 'posts' }
          },
          categoryId: {
            description: 'will throw if present, no such table',
            type: 'integer',
            idExists: { table: 'categories' }
          }
        }
      };

      var schema2 = {
        $async: true,
        properties: {
          userId: {
            type: 'integer',
            idExistsCompiled: { table: 'users' }
          },
          postId: {
            type: 'integer',
            idExistsCompiled: { table: 'posts' }
          }
        }
      };

      return repeat(function() { return Promise.all([
        test(instances, schema1, true),
        test(instances, schema2)
      ]); });

      function test(instances, schema, checkThrow) {
        return Promise.map(instances, function (ajv) {
          var validate = ajv.compile(schema);
          var _co = useCo(ajv);

          return Promise.all([
            shouldBeValid(   _co(validate({ userId: 1, postId: 21 })) ),
            shouldBeValid(   _co(validate({ userId: 5, postId: 25 })) ),
            shouldBeInvalid( _co(validate({ userId: 5, postId: 10 })) ), // no post
            shouldBeInvalid( _co(validate({ userId: 9, postId: 25 })) ), // no user
            checkThrow
              ? shouldThrow(     _co(validate({ postId: 25, categoryId: 1  })), 'no such table' )
              : undefined
          ]);
        });
      }
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
  });


  describe('async referenced schemas', function() {
    beforeEach(function() {
      getInstances({ inlineRefs: false });
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
      Ajv({ async: 'es8' });
    });
  });


  it('should throw error with unknown transpile option', function() {
    shouldThrowFunc('bad transpiler: babel', function() {
      Ajv({ transpile: 'babel' });
    });

    shouldThrowFunc('bad transpiler: [object Object]', function() {
      Ajv({ transpile: {} });
    });
  });


  it('should set async option to es7 if tranpiler is nodent', function() {
    var ajv1 = Ajv({ transpile: 'nodent' });
    ajv1._opts.async .should.equal('es7');

    var ajv2 = Ajv({ async: '*', transpile: 'nodent' });
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
function shouldBeInvalid(p) {
  return checkNotValid(p)
  .then(function (err) {
    err .should.be.instanceof(Ajv.ValidationError);
    err.errors .should.be.an('array');
    err.validation .should.equal(true);
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
