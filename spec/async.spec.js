'use strict';


var Ajv = require(typeof window == 'object' ? 'ajv' : '../lib/ajv')
  , should = require('chai').should()
  , stableStringify = require('json-stable-stringify');


describe('compileAsync method', function() {
	var ajv;

  var SCHEMAS = {
    "http://example.com/object.json": {
      "id": "http://example.com/object.json",
      "properties": {
        "b": { "$ref": "int2plus.json" }
      }
    },
    "http://example.com/int2plus.json": {
      "id": "http://example.com/int2plus.json",
      "type": "integer",
      "minimum": 2
    },
    "http://example.com/tree.json": {
    	"id": "http://example.com/tree.json",
    	"type": "array",
      "items": { "$ref": "leaf.json" }
    },
    "http://example.com/leaf.json": {
    	"id": "http://example.com/leaf.json",
    	"properties": {
	      "name": { "type": "string" },
	      "subtree": { "$ref": "tree.json" }
	     }
    },
    "http://example.com/recursive.json": {
    	"id": "http://example.com/recursive.json",
    	"properties": {
	      "b": { "$ref": "parent.json" }
	     },
	     "required": ["b"]
    }
  }

  beforeEach(function() {
    ajv = Ajv({ loadSchema: loadSchema });
  });


  it('should compile schemas loading missing schemas with options.loadSchema function', function (done) {
    var schema = {
      "id": "http://example.com/parent.json",
      "properties": {
        "a": { "$ref": "object.json" }
      }
    };
    ajv.compileAsync(schema, function (err, validate) {
      should.not.exist(err);
      validate .should.be.a('function');
      validate({ a: { b: 2 } }) .should.equal(true);
      validate({ a: { b: 1 } }) .should.equal(false);
      done();
    });
  });


  it('should correctly load schemas when missing reference has JSON path', function (done) {
    var schema = {
      "id": "http://example.com/parent.json",
      "properties": {
        "a": { "$ref": "object.json#/properties/b" }
      }
    };
    ajv.compileAsync(schema, function (err, validate) {
      should.not.exist(err);
      validate .should.be.a('function');
      validate({ a: 2 }) .should.equal(true);
      validate({ a: 1 }) .should.equal(false);
      done();
    });
  });


  it.skip('should correctly compile with remote schemas that have mutual references', function (done) {
    var schema = {
      "id": "http://example.com/root.json",
      "properties": {
        "tree": { "$ref": "tree.json" }
      }
    };
    ajv.compileAsync(schema, function (err, validate) {
      should.not.exist(err);
      validate .should.be.a('function');
      var validData = { tree: [
				{ name: 'a', subtree: [ { name: 'a.a' } ] },
				{ name: 'b' }
			] };
			var invalidData = { tree: [
				{ name: 'a', subtree: [ { name: 1 } ] }
			] };
      validate(validData) .should.equal(true);
      validate(invalidData) .should.equal(false);
      done();
    });
  });


  it('should correctly compile with remote schemas that reference the compiled schema', function (done) {
    var schema = {
      "id": "http://example.com/parent.json",
      "properties": {
        "a": { "$ref": "recursive.json" }
      }
    };
    ajv.compileAsync(schema, function (err, validate) {
      should.not.exist(err);
      validate .should.be.a('function');
      var validData = { a: { b: { a: { b: {} } } } };
      var invalidData = { a: { b: { a: {} } } };
      validate(validData) .should.equal(true);
      validate(invalidData) .should.equal(false);
      done();
    });
  });


  it('should return compiled schema on the next tick if there are no references', function (done) {
    var loadCalled = false;
    var ajv = Ajv({ loadSchema: function() {
      loadCalled = true;
    } });
    var schema = {
      "id": "http://example.com/int2plus.json",
      "type": "integer",
      "minimum": 2
    };
    ajv.compileAsync(schema, function (err, validate) {
      beforeCallback1 .should.equal(true);
      spec(err, validate);
      ajv.compileAsync(schema, function (err, validate) {
        beforeCallback2 .should.equal(true);
        spec(err, validate);
        done();
      });
      var beforeCallback2 = true;
    });
    var beforeCallback1 = true;

    function spec(err, validate) {
      should.not.exist(err);
      loadCalled .should.equal(false);
      validate .should.be.a('function');
      var validData = 2;
      var invalidData = 1;
      validate(validData) .should.equal(true);
      validate(invalidData) .should.equal(false);
    }
  });


  function loadSchema(uri, callback) {
    setTimeout(function() {
      if (SCHEMAS[uri]) callback(null, SCHEMAS[uri]);
      else callback(new Error('404'));
    }, 10);
  }
});
