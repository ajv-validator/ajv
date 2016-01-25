'use strict';

try { eval("(function*(){})()"); var hasGenerators = true; } catch(e){}

var Ajv = require('./ajv')
  , should = require('./chai').should()
  , co = require('co');


(hasGenerators ? describe : describe.skip)
('async schemas, formats and keywords', function() {
  var ajv, fullAjv;

  beforeEach(function () {
    ajv = Ajv();
    fullAjv = Ajv({ allErrors: true });
  });

  describe('async schemas without async elements', function() {
    it('should pass result via callback in setTimeout', function() {
      var schema = {
        $async: true,
        type: 'string',
        maxLength: 3
      };

      return Promise.all([
        test(ajv),
        test(fullAjv)
      ]);

      function test(ajv) {
        var validate = ajv.compile(schema);

        return Promise.all([
          shouldBeValid(   co(validate('abc')) ),
          shouldBeInvalid( co(validate('abcd')) ),
          shouldBeInvalid( co(validate(1)) )
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

    function addFormatEnglishWord() {
      [ajv, fullAjv].forEach(function (ajv) {
        ajv.addFormat('english_word', {
          async: true,
          validate: checkWordOnServer
        });
      });
    }

    it('should return promise that resolves as true or rejects with array of errors', function() {
      var schema = {
        $async: true,
        type: 'string',
        format: 'english_word',
        minimum: 5
      };

      return Promise.all([
        test(ajv),
        test(fullAjv)
      ]);

      function test(ajv) {
        var validate = ajv.compile(schema);

        return Promise.all([
          shouldBeValid(   co(validate('tomorrow')) ),
          shouldBeInvalid( co(validate('manana')) ),
          shouldBeInvalid( co(validate(1)) ),
          shouldThrow(     co(validate('today')), 'unknown word' )
        ]);
      }
    });


    it('should fail compilation if async format is inside sync schema or subschema', function() {
      test(ajv);
      test(fullAjv);

      function test(ajv) {
        var schema1 = {
          type: 'string',
          format: 'english_word',
          minimum: 5
        };

        shouldThrowFunc('async format in sync schema', function() {
          ajv.compile(schema1);
        })
        schema1.$async = true;
        ajv.compile(schema1);


        var schema2 = {
          $async: true,
          properties: {
            foo: {
              type: 'string',
              format: 'english_word',
              minimum: 5
            }
          }
        };

        shouldThrowFunc('async format in sync schema', function() {
          ajv.compile(schema2);
        })
        schema2.properties.foo.$async = true;
        ajv.compile(schema2);
      }
    });


    it('should support async formats when $data ref resolves to async format name', function() {
      ajv = Ajv({ v5: true, beautify: true });
      fullAjv = Ajv({ v5: true, allErrors: true, beautify: true });
      addFormatEnglishWord();

      var schema = {
        $async: true,
        additionalProperties: {
          type: 'string',
          format: { $data: '0#' }
        }
      };

      return Promise.all([
        test(ajv),
        test(fullAjv)
      ]);

      function test(ajv) {
        debugger;
        var validate = ajv.compile(schema);

        return Promise.all([
          shouldBeValid(   co(validate({ english_word: 'tomorrow' })) ),
          shouldBeInvalid( co(validate({ english_word: 'manana' })) ),
          shouldBeInvalid( co(validate({ english_word: 1 })) ),
          shouldThrow(     co(validate({ english_word: 'today' })), 'unknown word' ),

          shouldBeValid(   co(validate({ date: '2016-01-25' })) ),
          shouldBeInvalid( co(validate({ date: '01/25/2016' })) ),
          shouldBeInvalid( co(validate({ date: 1 })) ),
        ]);
      }
    });


    function checkWordOnServer(str) {
      return str == 'tomorrow' ? Promise.resolve(true)
              : str == 'manana' ? Promise.resolve(false)
              : Promise.reject(new Error('unknown word'));
    }
  });
});


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
