'use strict';

var Ajv = require('./ajv')
  , should = require('./chai').should()
  , stableStringify = require('fast-json-stable-stringify');


describe('Ajv', function () {
  var ajv;

  beforeEach(function() {
    ajv = new Ajv;
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
      var v1 = ajv.compile({ $id: '//e.com/int.json', type: 'integer', minimum: 1 });
      var v2 = ajv.compile({ $id: '//e.com/int.json', minimum: 1, type: 'integer' });
      v1 .should.equal(v2);
    });

    it('should throw if different schema has the same id', function() {
      ajv.compile({ $id: '//e.com/int.json', type: 'integer' });
      should.throw(function() {
        ajv.compile({ $id: '//e.com/int.json', type: 'integer', minimum: 1 });
      });
    });

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

      schema = { even: false };
      should.throw(function() {
        ajv.compile(schema);
      });

      function badEvenCode(it, keyword, _schema) {
        var op = _schema ? '===' : '!==='; // invalid on purpose
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
      ajv.validate({ $id: '//e.com/int.json', type: 'integer' }, 1) .should.equal(true);
      ajv.validate('//e.com/int.json', 1) .should.equal(true);
      ajv.validate('//e.com/int.json', '1') .should.equal(false);

      ajv.compile({ $id: '//e.com/str.json', type: 'string' }) .should.be.a('function');
      ajv.validate('//e.com/str.json', 'a') .should.equal(true);
      ajv.validate('//e.com/str.json', 1) .should.equal(false);
    });

    it('should throw exception if no schema with ref', function() {
      ajv.validate({ $id: 'integer', type: 'integer' }, 1) .should.equal(true);
      ajv.validate('integer', 1) .should.equal(true);
      should.throw(function() { ajv.validate('string', 'foo'); });
    });

    it('should validate schema fragment by ref', function() {
      ajv.addSchema({
        "$id": "http://e.com/types.json",
        "definitions": {
          "int": { "type": "integer" },
          "str": { "type": "string" }
        }
      });

      ajv.validate('http://e.com/types.json#/definitions/int', 1) .should.equal(true);
      ajv.validate('http://e.com/types.json#/definitions/int', '1') .should.equal(false);
    });

    it('should return schema fragment by id', function() {
      ajv.addSchema({
        "$id": "http://e.com/types.json",
        "definitions": {
          "int": { "$id": "#int", "type": "integer" },
          "str": { "$id": "#str", "type": "string" }
        }
      });

      ajv.validate('http://e.com/types.json#int', 1) .should.equal(true);
      ajv.validate('http://e.com/types.json#int', '1') .should.equal(false);
    });
  });


  describe('addSchema method', function() {
    it('should add and compile schema with key', function() {
      ajv.addSchema({ type: 'integer' }, 'int');
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
      ajv.addSchema({ $id: '//e.com/int.json', type: 'integer' });
      ajv.validate('//e.com/int.json', 1) .should.equal(true);
      ajv.validate('//e.com/int.json', '1') .should.equal(false);
    });

    it('should normalize schema keys and ids', function() {
      ajv.addSchema({ $id: '//e.com/int.json#', type: 'integer' }, 'int#');
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
        { $id: '//e.com/int.json', type: 'integer' },
        { $id: '//e.com/str.json', type: 'string' }
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
      should.throw(function() { ajv.addSchema('foo'); });
    });

    it('should throw if schema id is not a string', function() {
      try {
        ajv.addSchema({ $id: 1, type: 'integer' });
        throw new Error('should have throw exception');
      } catch(e) {
        e.message .should.equal('schema id must be string');
      }
    });

    it('should return instance of itself', function() {
      var res = ajv.addSchema({ type: 'integer' }, 'int');
      res.should.equal(ajv);
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
      ajv.addSchema({ $id: '//e.com/int.json', type: 'integer' });
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

    it('should return schema fragment by ref', function() {
      ajv.addSchema({
        "$id": "http://e.com/types.json",
        "definitions": {
          "int": { "type": "integer" },
          "str": { "type": "string" }
        }
      });

      var vInt = ajv.getSchema('http://e.com/types.json#/definitions/int');
      vInt(1) .should.equal(true);
      vInt('1') .should.equal(false);
    });

    it('should return schema fragment by ref with protocol-relative URIs', function() {
      ajv.addSchema({
        "$id": "//e.com/types.json",
        "definitions": {
          "int": { "type": "integer" },
          "str": { "type": "string" }
        }
      });

      var vInt = ajv.getSchema('//e.com/types.json#/definitions/int');
      vInt(1) .should.equal(true);
      vInt('1') .should.equal(false);
    });

    it('should return schema fragment by id', function() {
      ajv.addSchema({
        "$id": "http://e.com/types.json",
        "definitions": {
          "int": { "$id": "#int", "type": "integer" },
          "str": { "$id": "#str", "type": "string" }
        }
      });

      var vInt = ajv.getSchema('http://e.com/types.json#int');
      vInt(1) .should.equal(true);
      vInt('1') .should.equal(false);
    });
  });


  describe('removeSchema method', function() {
    it('should remove schema by key', function() {
      var schema = { type: 'integer' }
        , str = stableStringify(schema);
      ajv.addSchema(schema, 'int');
      var v = ajv.getSchema('int');

      v .should.be.a('function');
      ajv._cache.get(str).validate .should.equal(v);

      ajv.removeSchema('int');
      should.not.exist(ajv.getSchema('int'));
      should.not.exist(ajv._cache.get(str));
    });

    it('should remove schema by id', function() {
      var schema = { $id: '//e.com/int.json', type: 'integer' }
        , str = stableStringify(schema);
      ajv.addSchema(schema);

      var v = ajv.getSchema('//e.com/int.json');
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
      var schema = { $id: '//e.com/int.json', type: 'integer' }
        , str = stableStringify(schema);
      ajv.addSchema(schema);
      ajv._cache.get(str) .should.be.an('object');
      ajv.removeSchema({ $id: '//e.com/int.json', type: 'integer' });
      // should.not.exist(ajv.getSchema('//e.com/int.json'));
      should.not.exist(ajv._cache.get(str));
    });

    it('should not throw if there is no schema with passed id', function() {
      should.not.exist(ajv.getSchema('//e.com/int.json'));
      should.not.throw(function() {
        ajv.removeSchema('//e.com/int.json');
      });
    });

    it('should remove all schemas but meta-schemas if called without an arguments', function() {
      var schema1 = { $id: '//e.com/int.json', type: 'integer' }
        , str1 = stableStringify(schema1);
      ajv.addSchema(schema1);
      ajv._cache.get(str1) .should.be.an('object');

      var schema2 = { type: 'integer' }
        , str2 = stableStringify(schema2);
      ajv.addSchema(schema2);
      ajv._cache.get(str2) .should.be.an('object');

      ajv.removeSchema();
      should.not.exist(ajv._cache.get(str1));
      should.not.exist(ajv._cache.get(str2));
    });

    it('should remove all schemas but meta-schemas with key/id matching pattern', function() {
      var schema1 = { $id: '//e.com/int.json', type: 'integer' }
        , str1 = stableStringify(schema1);
      ajv.addSchema(schema1);
      ajv._cache.get(str1) .should.be.an('object');

      var schema2 = { $id: 'str.json', type: 'string' }
        , str2 = stableStringify(schema2);
      ajv.addSchema(schema2, '//e.com/str.json');
      ajv._cache.get(str2) .should.be.an('object');

      var schema3 = { type: 'integer' }
        , str3 = stableStringify(schema3);
      ajv.addSchema(schema3);
      ajv._cache.get(str3) .should.be.an('object');

      ajv.removeSchema(/e\.com/);
      should.not.exist(ajv._cache.get(str1));
      should.not.exist(ajv._cache.get(str2));
      ajv._cache.get(str3) .should.be.an('object');
    });

    it('should return instance of itself', function() {
      var res = ajv
        .addSchema({ type: 'integer' }, 'int')
        .removeSchema('int');
      res.should.equal(ajv);
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

    it('should add format as object', function() {
      ajv.addFormat('identifier', {
        validate: function (str) { return /^[a-z_$][a-z0-9_$]*$/i.test(str); },
      });
      testFormat();
    });

    it('should return instance of itself', function() {
      var res = ajv.addFormat('identifier', /^[a-z_$][a-z0-9_$]*$/i);
      res.should.equal(ajv);
    });

    function testFormat() {
      var validate = ajv.compile({ format: 'identifier' });
      validate('Abc1') .should.equal(true);
      validate('123') .should.equal(false);
      validate(123) .should.equal(true);
    }

    describe('formats for number', function() {
      it('should validate only numbers', function() {
        ajv.addFormat('positive', {
          type: 'number',
          validate: function(x) {
            return x > 0;
          }
        });

        var validate = ajv.compile({
          format: 'positive'
        });
        validate(-2) .should.equal(false);
        validate(0) .should.equal(false);
        validate(2) .should.equal(true);
        validate('abc') .should.equal(true);
      });

      it('should validate numbers with format via $data', function() {
        ajv = new Ajv({$data: true});
        ajv.addFormat('positive', {
          type: 'number',
          validate: function(x) {
            return x > 0;
          }
        });

        var validate = ajv.compile({
          properties: {
            data: { format: { $data: '1/frmt' } },
            frmt: { type: 'string' }
          }
        });
        validate({data: -2, frmt: 'positive'}) .should.equal(false);
        validate({data: 0, frmt: 'positive'})  .should.equal(false);
        validate({data: 2, frmt: 'positive'})  .should.equal(true);
        validate({data: 'abc', frmt: 'positive'}) .should.equal(true);
      });
    });
  });


  describe('validateSchema method', function() {
    it('should validate schema against meta-schema', function() {
      var valid = ajv.validateSchema({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'number'
      });

      valid .should.equal(true);
      should.equal(ajv.errors, null);

      valid = ajv.validateSchema({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'wrong_type'
      });

      valid .should.equal(false);
      ajv.errors.length .should.equal(3);
      ajv.errors[0].keyword .should.equal('enum');
      ajv.errors[1].keyword .should.equal('type');
      ajv.errors[2].keyword .should.equal('anyOf');
    });

    it('should throw exception if meta-schema is unknown', function() {
      should.throw(function() {
        ajv.validateSchema({
          $schema: 'http://example.com/unknown/schema#',
          type: 'number'
        });
      });
    });

    it('should throw exception if $schema is not a string', function() {
      should.throw(function() {
        ajv.validateSchema({
          $schema: {},
          type: 'number'
        });
      });
    });
  });
});
