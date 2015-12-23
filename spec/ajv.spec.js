'use strict';


var Ajv = require(typeof window == 'object' ? 'ajv' : '../lib/ajv')
  , should = require('chai').should()
  , stableStringify = require('json-stable-stringify');


describe('Ajv', function () {
  var ajv;

  beforeEach(function() {
    ajv = Ajv();
  });

  it('should create instance', function() {
    ajv .should.be.instanceof(Ajv);
  });


  describe('compile method', function() {
    it('should compile schema and return validating function', function() {
      var validate = ajv.compile({ type: 'integer' });
      validate .should.be.a('function');
      validate(1) .should.equal(true);
      validate(1.1) .should.equal(false);
      validate('1') .should.equal(false);
    });

    it('should cache compiled functions for the same schema', function() {
      var v1 = ajv.compile({ id: '//e.com/int.json', type: 'integer', minimum: 1 });
      var v2 = ajv.compile({ id: '//e.com/int.json', minimum: 1, type: 'integer' });
      v1 .should.equal(v2);
    })

    it('should throw if different schema has the same id', function() {
      ajv.compile({ id: '//e.com/int.json', type: 'integer' });
      should.throw(function() {
        ajv.compile({ id: '//e.com/int.json', type: 'integer', minimum: 1 });
      });
    })

    it('should throw if invalid schema is compiled', function() {
      should.throw(function() {
        ajv.compile({ type: null });
      });
    });

    it('should throw if compiled schema has an invalid JavaScript code', function() {
      ajv.addKeyword('even', { inline: badEvenCode });
      var schema = { even: true };
      var validate = ajv.compile(schema);
      validate(2) .should.equal(true);
      validate(3) .should.equal(false);

      var schema = { even: false };
      should.throw(function() {
        var validate = ajv.compile(schema);
      });

      function badEvenCode(it, keyword, schema) {
        var op = schema ? '===' : '!==='; // invalid on purpose
        return 'data' + (it.dataLevel || '') + ' % 2 ' + op + ' 0';
      }
    });
  });


  describe('validate method', function() {
    it('should compile schema and validate data against it', function() {
      ajv.validate({ type: 'integer' }, 1) .should.equal(true);
      ajv.validate({ type: 'integer' }, '1') .should.equal(false);
      ajv.validate({ type: 'string' }, 'a') .should.equal(true);
      ajv.validate({ type: 'string' }, 1) .should.equal(false);
    });

    it('should validate against previously compiled schema by id (also see addSchema)', function() {
      ajv.validate({ id: '//e.com/int.json', type: 'integer' }, 1) .should.equal(true);
      ajv.validate('//e.com/int.json', 1) .should.equal(true);
      ajv.validate('//e.com/int.json', '1') .should.equal(false);

      ajv.compile({ id: '//e.com/str.json', type: 'string' }) .should.be.a('function');
      ajv.validate('//e.com/str.json', 'a') .should.equal(true);
      ajv.validate('//e.com/str.json', 1) .should.equal(false);      
    });

    it('should throw exception if no schema with ref', function() {
      ajv.validate({ id: 'integer', type: 'integer' }, 1) .should.equal(true);
      ajv.validate('integer', 1) .should.equal(true);
      should.throw(function() { ajv.validate('string', 'foo'); });
    });
  });


  describe('addSchema method', function() {
    it('should add and compile schema with key', function() {
      var res = ajv.addSchema({ type: 'integer' }, 'int');
      should.not.exist(res);
      var validate = ajv.getSchema('int');
      validate .should.be.a('function');

      validate(1) .should.equal(true);
      validate(1.1) .should.equal(false);
      validate('1') .should.equal(false);
      ajv.validate('int', 1) .should.equal(true);
      ajv.validate('int', '1') .should.equal(false);
    });

    it('should add and compile schema without key', function() {
      ajv.addSchema({ type: 'integer' });
      ajv.validate('', 1) .should.equal(true);
      ajv.validate('', '1') .should.equal(false);
    });

    it('should add and compile schema with id', function() {
      ajv.addSchema({ id: '//e.com/int.json', type: 'integer' });
      ajv.validate('//e.com/int.json', 1) .should.equal(true);
      ajv.validate('//e.com/int.json', '1') .should.equal(false);
    });

    it('should normalize schema keys and ids', function() {
      ajv.addSchema({ id: '//e.com/int.json#', type: 'integer' }, 'int#');
      ajv.validate('int', 1) .should.equal(true);
      ajv.validate('int', '1') .should.equal(false);
      ajv.validate('//e.com/int.json', 1) .should.equal(true);
      ajv.validate('//e.com/int.json', '1') .should.equal(false);
      ajv.validate('int#/', 1) .should.equal(true);
      ajv.validate('int#/', '1') .should.equal(false);
      ajv.validate('//e.com/int.json#/', 1) .should.equal(true);
      ajv.validate('//e.com/int.json#/', '1') .should.equal(false);
    });

    it('should add and compile array of schemas with ids', function() {
      ajv.addSchema([
        { id: '//e.com/int.json', type: 'integer' },
        { id: '//e.com/str.json', type: 'string' }
      ]);

      var validate0 = ajv.getSchema('//e.com/int.json');
      var validate1 = ajv.getSchema('//e.com/str.json');

      validate0(1) .should.equal(true);
      validate0('1') .should.equal(false);
      validate1('a') .should.equal(true);
      validate1(1) .should.equal(false);

      ajv.validate('//e.com/int.json', 1) .should.equal(true);
      ajv.validate('//e.com/int.json', '1') .should.equal(false);
      ajv.validate('//e.com/str.json', 'a') .should.equal(true);
      ajv.validate('//e.com/str.json', 1) .should.equal(false);
    });

    it('should throw on duplicate key', function() {
      ajv.addSchema({ type: 'integer' }, 'int');
      should.throw(function() {
        ajv.addSchema({ type: 'integer', minimum: 1 }, 'int');
      });
    });

    it('should throw on duplicate normalized key', function() {
      ajv.addSchema({ type: 'number' }, 'num');
      should.throw(function() {
        ajv.addSchema({ type: 'integer' }, 'num#');
      });
      should.throw(function() {
        ajv.addSchema({ type: 'integer' }, 'num#/');
      });
    });

    it('should allow only one schema without key and id', function() {
      ajv.addSchema({ type: 'number' });
      should.throw(function() {
        ajv.addSchema({ type: 'integer' });
      });
      should.throw(function() {
        ajv.addSchema({ type: 'integer' }, '');
      });
      should.throw(function() {
        ajv.addSchema({ type: 'integer' }, '#');
      });
    });

    it('should throw if schema is not an object', function() {
      should.throw(function() { ajv.addSchema('foo') });
    });
  });


  describe('getSchema method', function() {
    it('should return compiled schema by key', function() {
      ajv.addSchema({ type: 'integer' }, 'int');
      var validate = ajv.getSchema('int');
      validate(1) .should.equal(true);
      validate('1') .should.equal(false);
    });

    it('should return compiled schema by id or ref', function() {
      ajv.addSchema({ id: '//e.com/int.json', type: 'integer' });
      var validate = ajv.getSchema('//e.com/int.json');
      validate(1) .should.equal(true);
      validate('1') .should.equal(false);
    });

    it('should return compiled schema without key or with empty key', function() {
      ajv.addSchema({ type: 'integer' });
      var validate = ajv.getSchema('');
      validate(1) .should.equal(true);
      validate('1') .should.equal(false);

      var v = ajv.getSchema();
      v(1) .should.equal(true);
      v('1') .should.equal(false);
    });
  });


  describe('removeSchema method', function() {
    it('should remove schema by key', function() {
      var schema = { type: 'integer' }
        , str = stableStringify(schema);
      ajv.addSchema(schema, 'int');
      var v = ajv.getSchema('int')

      v .should.be.a('function');
      ajv._cache.get(str).validate .should.equal(v);

      ajv.removeSchema('int');
      should.not.exist(ajv.getSchema('int'));
      should.not.exist(ajv._cache.get(str));
    });

    it('should remove schema by id', function() {
      var schema = { id: '//e.com/int.json', type: 'integer' }
        , str = stableStringify(schema);
      ajv.addSchema(schema);

      var v = ajv.getSchema('//e.com/int.json')
      v .should.be.a('function');
      ajv._cache.get(str).validate .should.equal(v);

      ajv.removeSchema('//e.com/int.json');
      should.not.exist(ajv.getSchema('//e.com/int.json'));
      should.not.exist(ajv._cache.get(str));
    });

    it('should remove schema by schema object', function() {
      var schema = { type: 'integer' }
        , str = stableStringify(schema);
      ajv.addSchema(schema);
      ajv._cache.get(str) .should.be.an('object');
      ajv.removeSchema({ type: 'integer' });
      should.not.exist(ajv._cache.get(str));
    });

    it('should remove schema with id by schema object', function() {
      var schema = { id: '//e.com/int.json', type: 'integer' }
        , str = stableStringify(schema);
      ajv.addSchema(schema);
      ajv._cache.get(str) .should.be.an('object');
      ajv.removeSchema({ id: '//e.com/int.json', type: 'integer' });
      // should.not.exist(ajv.getSchema('//e.com/int.json'));
      should.not.exist(ajv._cache.get(str));
    });
  });


  describe('addFormat method', function() {
    it('should add format as regular expression', function() {
      ajv.addFormat('identifier', /^[a-z_$][a-z0-9_$]*$/i);
      testFormat();
    });

    it('should add format as string', function() {
      ajv.addFormat('identifier', '^[A-Za-z_$][A-Za-z0-9_$]*$');
      testFormat();
    });

    it('should add format as function', function() {
      ajv.addFormat('identifier', function (str) { return /^[a-z_$][a-z0-9_$]*$/i.test(str); });
      testFormat();
    });

    function testFormat() {
      var validate = ajv.compile({ format: 'identifier' });
      validate('Abc1') .should.equal(true);
      validate('123') .should.equal(false);
      validate(123) .should.equal(true);
    }
  });
});
