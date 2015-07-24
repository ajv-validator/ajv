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
  });


  describe('addSchema method', function() {
    it('should add and compile schema with key', function() {
      var validate = ajv.addSchema({ type: 'integer' }, 'int');
      validate .should.be.a('function');
      validate(1) .should.equal(true);
      validate(1.1) .should.equal(false);
      validate('1') .should.equal(false);
      ajv.validate('int', 1) .should.equal(true);
      ajv.validate('int', '1') .should.equal(false);
    });

    it('should add and compile schema without key', function() {
      var validate = ajv.addSchema({ type: 'integer' });
      ajv.validate('', 1) .should.equal(true);
      ajv.validate('', '1') .should.equal(false);
    });

    it('should add and compile schema with id', function() {
      var validate = ajv.addSchema({ id: '//e.com/int.json', type: 'integer' });
      ajv.validate('//e.com/int.json', 1) .should.equal(true);
      ajv.validate('//e.com/int.json', '1') .should.equal(false);
    });

    it('should normalize schema keys and ids', function() {
      var validate = ajv.addSchema({ id: '//e.com/int.json#', type: 'integer' }, 'int#');
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
      var validators = ajv.addSchema([
        { id: '//e.com/int.json', type: 'integer' },
        { id: '//e.com/str.json', type: 'string' }
      ]);

      validators .should.be.an('array').with.length(2);

      validators[0](1) .should.equal(true);
      validators[0]('1') .should.equal(false);
      validators[1]('a') .should.equal(true);
      validators[1](1) .should.equal(false);

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
  });


  describe('getSchema method', function() {
    it('should return compiled schema by key', function() {
      var validate = ajv.addSchema({ type: 'integer' }, 'int');
      var v = ajv.getSchema('int');
      v .should.equal(validate);
      v(1) .should.equal(true);
      v('1') .should.equal(false);
    });

    it('should return compiled schema by id or ref', function() {
      var validate = ajv.addSchema({ id: '//e.com/int.json', type: 'integer' });
      var v = ajv.getSchema('//e.com/int.json');
      v .should.equal(validate);
      v(1) .should.equal(true);
      v('1') .should.equal(false);
    });

    it('should return compiled schema without key or with empty key', function() {
      var validate = ajv.addSchema({ type: 'integer' });
      var v = ajv.getSchema('');
      v .should.equal(validate);
      v(1) .should.equal(true);
      v('1') .should.equal(false);

      var v = ajv.getSchema();
      v .should.equal(validate);
    });
  });


  describe('removeSchema method', function() {
    it('should remove schema by key', function() {
      var schema = { type: 'integer' }
        , str = stableStringify(schema);
      var v = ajv.addSchema(schema, 'int');
      ajv.getSchema('int') .should.equal(v);
      ajv._cache.get(str) .should.equal(v);

      ajv.removeSchema('int');
      should.not.exist(ajv.getSchema('int'));
      should.not.exist(ajv._cache.get(str));
    });

    it('should remove schema by id', function() {
      var schema = { id: '//e.com/int.json', type: 'integer' }
        , str = stableStringify(schema);
      var v = ajv.addSchema(schema);
      ajv.getSchema('//e.com/int.json') .should.equal(v);
      ajv._cache.get(str) .should.equal(v);

      ajv.removeSchema('//e.com/int.json');
      should.not.exist(ajv.getSchema('//e.com/int.json'));
      should.not.exist(ajv._cache.get(str));
    });

    it('should remove schema by schema object', function() {
      var schema = { type: 'integer' }
        , str = stableStringify(schema);
      var v = ajv.addSchema(schema);
      ajv._cache.get(str) .should.equal(v);

      ajv.removeSchema({ type: 'integer' });
      // should.not.exist(ajv.getSchema('int'));
      should.not.exist(ajv._cache.get(str));
    });
  });
});
