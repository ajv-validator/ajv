'use strict';


var Ajv = require(typeof window == 'object' ? 'ajv' : '../lib/ajv')
  , should = require('chai').should()
  , stableStringify = require('json-stable-stringify');


describe('compileAsync method', function() {
	var ajv, loadCallCount;

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
    },
    "http://example.com/invalid.json": {
      "id": "http://example.com/recursive.json",
      "properties": {
        "invalid": { "type": "number" }
       },
       "required": "invalid"
    }
  }

  beforeEach(function() {
    loadCallCount = 0;
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
      should.equal(loadCallCount, 2);
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
      should.equal(loadCallCount, 2);
      should.not.exist(err);
      validate .should.be.a('function');
      validate({ a: 2 }) .should.equal(true);
      validate({ a: 1 }) .should.equal(false);
      done();
    });
  });


  it('should correctly compile with remote schemas that have mutual references', function (done) {
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
      should.equal(loadCallCount, 1);
      should.not.exist(err);
      validate .should.be.a('function');
      var validData = { a: { b: { a: { b: {} } } } };
      var invalidData = { a: { b: { a: {} } } };
      validate(validData) .should.equal(true);
      validate(invalidData) .should.equal(false);
      done();
    });
  });


  it('should return compiled schema on the next tick if there are no references (#51)', function (done) {
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
      should.equal(loadCallCount, 0);
      validate .should.be.a('function');
      var validData = 2;
      var invalidData = 1;
      validate(validData) .should.equal(true);
      validate(invalidData) .should.equal(false);
    }
  });


  it('should queue calls so only one compileAsync executes at a time (#52)', function (done) {
    var schema = {
      "id": "http://example.com/parent.json",
      "properties": {
        "a": { "$ref": "object.json" }
      }
    };

    var completedCount = 0;
    ajv.compileAsync(schema, spec);
    ajv.compileAsync(schema, spec);
    ajv.compileAsync(schema, spec);

    function spec(err, validate) {
      should.not.exist(err);
      validate .should.be.a('function');
      validate({ a: { b: 2 } }) .should.equal(true);
      validate({ a: { b: 1 } }) .should.equal(false);
      completed();
    }

    function completed() {
      completedCount++;
      if (completedCount == 3) {
        should.equal(loadCallCount, 2);
        done();
      }
    }
  });


  it('should throw exception if loadSchema is not passed', function (done) {
    var schema = {
      "id": "http://example.com/int2plus.json",
      "type": "integer",
      "minimum": 2
    };
    var ajv = Ajv();
    should.throw(function() {
      ajv.compileAsync(schema, function() {
        done(new Error('it should have thrown exception'));
      });
    });
    setTimeout(function() {
      // function is needed for the test to pass in Firefox 4
      done();
    });
  });


  describe('should return error via callback', function() {
    it('if passed schema is invalid', function (done) {
      var invalidSchema = {
        "id": "http://example.com/int2plus.json",
        "type": "integer",
        "minimum": "invalid"
      };
      ajv.compileAsync(invalidSchema, function (err, validate) {
        should.exist(err);
        should.not.exist(validate);
        done();
      });
    });

    it('if loaded schema is invalid', function (done) {
      var schema = {
        "id": "http://example.com/parent.json",
        "properties": {
          "a": { "$ref": "invalid.json" }
        }
      };
      ajv.compileAsync(schema, function (err, validate) {
        should.exist(err);
        should.not.exist(validate);
        done();
      });
    });

    it('if loadSchema returned error', function (done) {
      var schema = {
        "id": "http://example.com/parent.json",
        "properties": {
          "a": { "$ref": "object.json" }
        }
      };
      var ajv = Ajv({ loadSchema: badLoadSchema });
      ajv.compileAsync(schema, function (err, validate) {
        should.exist(err);
        should.not.exist(validate);
        done();
      });

      function badLoadSchema(ref, callback) {
        setTimeout(function() { callback(new Error('cant load')); });
      }
    });
  });


  function loadSchema(uri, callback) {
    loadCallCount++;
    setTimeout(function() {
      if (SCHEMAS[uri]) callback(null, SCHEMAS[uri]);
      else callback(new Error('404'));
    }, 10);
  }
});
