'use strict';

var Ajv = require('./ajv')
  , should = require('./chai').should()
  , getAjvInstances = require('./ajv_instances');


describe('resolve', function () {
  var instances;

  beforeEach(function() {
    instances = getAjvInstances({
      allErrors:    true,
      verbose:      true,
      inlineRefs:   false
    });
  });

  describe('resolve.ids method', function() {
    it('should resolve ids in schema', function() {
      // Example from http://json-schema.org/latest/json-schema-core.html#anchor29
      var schema = {
        "$id": "http://x.y.z/rootschema.json#",
        "schema1": {
          "$id": "#foo",
          "description": "schema1",
          "type": "integer"
        },
        "schema2": {
          "$id": "otherschema.json",
          "description": "schema2",
          "nested": {
            "$id": "#bar",
            "description": "nested",
            "type": "string"
          },
          "alsonested": {
            "$id": "t/inner.json#a",
            "description": "alsonested",
            "type": "boolean"
          }
        },
        "schema3": {
          "$id": "some://where.else/completely#",
          "description": "schema3",
          "type": "null"
        },
        "properties": {
          "foo": { "$ref": "#foo" },
          "bar": { "$ref": "otherschema.json#bar" },
          "baz": { "$ref": "t/inner.json#a" },
          "bax": { "$ref": "some://where.else/completely#" }
        },
        "required": [ "foo", "bar", "baz", "bax" ]
      };

      instances.forEach(function (ajv) {
        var validate = ajv.compile(schema);
        var data = { foo: 1, bar: 'abc', baz: true, bax: null };
        validate(data) .should.equal(true);
      });
    });


    it('should throw if the same id resolves to two different schemas', function() {
      instances.forEach(function (ajv) {
        ajv.compile({
          "$id": "http://example.com/1.json",
          "type": "integer"
        });
        should.throw(function() {
          ajv.compile({
            "additionalProperties": {
              "$id": "http://example.com/1.json",
              "type": "string"
            }
          });
        });

        should.throw(function() {
          ajv.compile({
            "items": {
              "$id": "#int",
              "type": "integer"
            },
            "additionalProperties": {
              "$id": "#int",
              "type": "string"
            }
          });
        });
      });
    });

    it('should resolve ids defined as urn\'s (issue #423)', function() {
      var schema = {
        "type": "object",
        "properties": {
          "ip1": {
            "$id": "urn:some:ip:prop",
            "type": "string",
            "format": "ipv4"
          },
          "ip2": {
            "$ref": "urn:some:ip:prop"
          }
        },
        "required": [
          "ip1",
          "ip2"
        ]
      };

      var data = {
        "ip1": "0.0.0.0",
        "ip2": "0.0.0.0"
      };
      instances.forEach(function (ajv) {
        var validate = ajv.compile(schema);
        validate(data) .should.equal(true);
      });
    });
  });


  describe('protocol-relative URIs', function() {
    it('should resolve fragment', function() {
      instances.forEach(function(ajv) {
        var schema = {
          "$id": "//e.com/types",
          "definitions": {
            "int": { "type": "integer" }
          }
        };

        ajv.addSchema(schema);
        var validate = ajv.compile({ $ref: '//e.com/types#/definitions/int' });
        validate(1) .should.equal(true);
        validate('foo') .should.equal(false);
      });
    });
  });


  describe('missing schema error', function() {
    this.timeout(4000);

    it('should contain missingRef and missingSchema', function() {
      testMissingSchemaError({
        baseId: 'http://example.com/1.json',
        ref: 'http://another.com/int.json',
        expectedMissingRef: 'http://another.com/int.json',
        expectedMissingSchema: 'http://another.com/int.json'
      });
    });

    it('should resolve missingRef and missingSchema relative to base id', function() {
      testMissingSchemaError({
        baseId: 'http://example.com/folder/1.json',
        ref: 'int.json',
        expectedMissingRef: 'http://example.com/folder/int.json',
        expectedMissingSchema: 'http://example.com/folder/int.json'
      });
    });

    it('should resolve missingRef and missingSchema relative to base id from root', function() {
      testMissingSchemaError({
        baseId: 'http://example.com/folder/1.json',
        ref: '/int.json',
        expectedMissingRef: 'http://example.com/int.json',
        expectedMissingSchema: 'http://example.com/int.json'
      });
    });

    it('missingRef should and missingSchema should NOT include JSON path (hash fragment)', function() {
      testMissingSchemaError({
        baseId: 'http://example.com/1.json',
        ref: 'int.json#/definitions/positive',
        expectedMissingRef: 'http://example.com/int.json#/definitions/positive',
        expectedMissingSchema: 'http://example.com/int.json'
      });
    });

    it('should throw missing schema error if same path exist in the current schema but id is different (issue #220)', function() {
      testMissingSchemaError({
        baseId: 'http://example.com/parent.json',
        ref: 'object.json#/properties/a',
        expectedMissingRef: 'http://example.com/object.json#/properties/a',
        expectedMissingSchema: 'http://example.com/object.json'
      });
    });


    function testMissingSchemaError(opts) {
      instances.forEach(function (ajv) {
        try {
          ajv.compile({
            "$id": opts.baseId,
            "properties": { "a": { "$ref": opts.ref } }
          });
        } catch(e) {
          e.missingRef .should.equal(opts.expectedMissingRef);
          e.missingSchema .should.equal(opts.expectedMissingSchema);
        }
      });
    }
  });


  describe('inline referenced schemas without refs in them', function() {
    var schemas = [
      { $id: 'http://e.com/obj.json#',
        properties: { a: { $ref: 'int.json#' } } },
      { $id: 'http://e.com/int.json#',
        type: 'integer', minimum: 2, maximum: 4 },
      { $id: 'http://e.com/obj1.json#',
        definitions: { int: { type: 'integer', minimum: 2, maximum: 4 } },
        properties: { a: { $ref: '#/definitions/int' } } },
      { $id: 'http://e.com/list.json#',
        items: { $ref: 'obj.json#' } }
    ];

    it('by default should inline schema if it doesn\'t contain refs', function() {
      var ajv = new Ajv({ schemas: schemas });
      testSchemas(ajv, true);
    });


    it('should NOT inline schema if option inlineRefs == false', function() {
      var ajv = new Ajv({ schemas: schemas, inlineRefs: false });
      testSchemas(ajv, false);
    });


    it('should inline schema if option inlineRefs is bigger than number of keys in referenced schema', function() {
      var ajv = new Ajv({ schemas: schemas, inlineRefs: 3 });
      testSchemas(ajv, true);
    });


    it('should NOT inline schema if option inlineRefs is less than number of keys in referenced schema', function() {
      var ajv = new Ajv({ schemas: schemas, inlineRefs: 2 });
      testSchemas(ajv, false);
    });


    it('should avoid schema substitution when refs are inlined (issue #77)', function() {
      var ajv = new Ajv({ verbose: true });

      var schemaMessage = {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: "http://e.com/message.json#",
        type: "object",
        required: ["header"],
        properties: {
          header: {
            allOf: [
              { $ref: "header.json" },
              { properties: { msgType: { "enum": [0] } } }
            ]
          }
        }
      };

      // header schema
      var schemaHeader = {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: "http://e.com/header.json#",
        type: "object",
        properties: {
          version: {
            type: "integer",
            maximum: 5
          },
          msgType: { type: "integer" }
        },
        required: ["version", "msgType"]
      };

      // a good message
      var validMessage = {
        header: {
          version: 4,
          msgType: 0
        }
      };

      // a bad message
      var invalidMessage = {
        header: {
          version: 6,
          msgType: 0
        }
      };

      // add schemas and get validator function
      ajv.addSchema(schemaHeader);
      ajv.addSchema(schemaMessage);
      var v = ajv.getSchema('http://e.com/message.json#');

      v(validMessage) .should.equal(true);
      v.schema.$id .should.equal('http://e.com/message.json#');

      v(invalidMessage) .should.equal(false);
      v.errors .should.have.length(1);
      v.schema.$id .should.equal('http://e.com/message.json#');

      v(validMessage) .should.equal(true);
      v.schema.$id .should.equal('http://e.com/message.json#');
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
