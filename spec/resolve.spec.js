'use strict';


var Ajv = require(typeof window == 'object' ? 'ajv' : '../lib/ajv')
  , should = require('chai').should();


// Example from http://json-schema.org/latest/json-schema-core.html#anchor29
var schema = {
  "id": "http://x.y.z/rootschema.json#",
  "schema1": {
    "id": "#foo",
    "description": "schema1"
  },
  "schema2": {
    "id": "otherschema.json",
    "description": "schema2",
    "nested": {
      "id": "#bar",
      "description": "nested"
    },
    "alsonested": {
      "id": "t/inner.json#a",
      "description": "alsonested"
    }
  },
  "schema3": {
    "id": "some://where.else/completely#",
    "description": "schema3"
  }
};


describe('resolve', function () {
  var ajv;

  beforeEach(function() {
    ajv = Ajv();
  });

  describe('resolve.ids method', function() {
    it('should resolve ids in schema', function() {
      var validate = ajv.compile(schema);
      // console.log(ajv._refs);
    });


    it('should throw if the same id resolves to two different schemas', function() {
      ajv.compile({
        "id": "http://example.com/1.json",
        "type": "integer"
      });
      should.throw(function() {
        ajv.compile({
          "additionalProperties": {
            "id": "http://example.com/1.json",
            "type": "string"
          }
        });
      });

      should.throw(function() {
        ajv.compile({
          "items": {
            "id": "#int",
            "type": "integer"
          },
          "additionalProperties": {
            "id": "#int",
            "type": "string"
          }
        });
      });
    });


    describe('inline referenced schemas without refs in them', function() {
      var schemas = [
        { id: 'http://e.com/obj.json#',
          properties: { a: { $ref: 'int.json#' } } },
        { id: 'http://e.com/int.json#',
          type: 'integer', minimum: 2, maximum: 4 },
        { id: 'http://e.com/obj1.json#',
          definitions: { int: { type: 'integer', minimum: 2, maximum: 4 } },
          properties: { a: { $ref: '#/definitions/int' } } },
        { id: 'http://e.com/list.json#',
          items: { $ref: 'obj.json#' } }
      ];

      it('by default should inline schema if it doesn\'t contain refs', function() {
        var ajv = Ajv({ schemas: schemas });
        testSchemas(ajv, true);
      });


      it('should NOT inline schema if option inlineRefs == false', function() {
        var ajv = Ajv({ schemas: schemas, inlineRefs: false });
        testSchemas(ajv, false);
      });


      it('should inline schema if option inlineRefs is bigger than number of keys in referenced schema', function() {
        var ajv = Ajv({ schemas: schemas, inlineRefs: 3 });
        testSchemas(ajv, true);
      });


      it('should NOT inline schema if option inlineRefs is less than number of keys in referenced schema', function() {
        var ajv = Ajv({ schemas: schemas, inlineRefs: 2 });
        testSchemas(ajv, false);
      });


      function testSchemas(ajv, expectedInlined) {
        var v1 = ajv.getSchema('http://e.com/obj.json')
          , v2 = ajv.getSchema('http://e.com/obj1.json')
          , vl = ajv.getSchema('http://e.com/list.json');
        testObjSchema(v1);
        testObjSchema(v2);
        testListSchema(vl);
        testInlined(v1, expectedInlined);
        testInlined(v2, expectedInlined);
        testInlined(vl, false);
      }

      function testObjSchema(validate) {
        validate({a:3}) .should.equal(true);
        validate({a:1}) .should.equal(false);
        validate({a:5}) .should.equal(false);
      }

      function testListSchema(validate) {
        validate([{a:3}]) .should.equal(true);
        validate([{a:1}]) .should.equal(false);
        validate([{a:5}]) .should.equal(false);
      }

      function testInlined(validate, expectedInlined) {
        var inlined = !(/refVal/.test(validate.toString()));
        inlined .should.equal(expectedInlined);
      }
    });
  });
});
