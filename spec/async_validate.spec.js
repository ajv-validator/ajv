'use strict';

var isBrowser = typeof window == 'object';
try { eval("(function*(){})()"); var hasGenerators = true; } catch(e){}
var skipTest = isBrowser || !hasGenerators;

var Ajv = require('./ajv')
  , should = require('./chai').should();

if (!skipTest) var co = require('' + 'co');


(skipTest ? describe.skip : describe)
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

      should.throw(function() {
        ajv.compile(schema);
      });

      schema.$async = true;

      ajv.compile(schema);
    });
  });


  describe('async formats', function() {
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
        ajv.addFormat('english_word', {
          async: true,
          validate: checkWordOnServer
        });

        var validate = ajv.compile(schema);

        return Promise.all([
          shouldBeValid(   co(validate('tomorrow')) ),
          shouldBeInvalid( co(validate('manana')) ),
          shouldBeInvalid( co(validate(1)) )
        ]);
      }

      function checkWordOnServer(str) {
        return str == 'tomorrow' ? Promise.resolve(true)
                : str == 'manana' ? Promise.resolve(false)
                : Promise.reject(new Error('unknown word'));
      }
    });
  });
});


function shouldBeValid(p) {
  return p.then(function (valid) {
    valid .should.equal(true);
  });
}


var SHOULD_BE_INVALID = 'test: should be invalid';
function shouldBeInvalid(p) {
  return p.then(function (valid) {
    throw new Error(SHOULD_BE_INVALID);
  })
  .catch(function (err) {
    if (err.message == SHOULD_BE_INVALID) throw err;
    err. should.be.instanceof(Error);
    err.errors .should.be.an('array');
    err.validation .should.equal(true);
  });
}
