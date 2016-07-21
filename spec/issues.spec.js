'use strict';

var Ajv = require('./ajv')
  , should = require('./chai').should();


describe('issue #8: schema with shared references', function() {
  it('should be supported by addSchema', spec('addSchema'));

  it('should be supported by compile', spec('compile'));

  function spec(method) {
    return function() {
      var ajv = new Ajv();

      var propertySchema = {
        type: 'string',
        maxLength: 4
      };

      var schema = {
        id: 'obj.json#',
        type: 'object',
        properties: {
          foo: propertySchema,
          bar: propertySchema
        }
      };

      ajv[method](schema);

      var result = ajv.validate('obj.json#', { foo: 'abc', bar: 'def' });
      result .should.equal(true);

      var result = ajv.validate('obj.json#', { foo: 'abcde', bar: 'fghg' });
      result .should.equal(false);
      ajv.errors .should.have.length(1);
    };
  }
});

describe('issue #50: references with "definitions"', function () {
  it('should be supported by addSchema', spec('addSchema'));

  it('should be supported by compile', spec('addSchema'));

  function spec(method) {
    return function() {
      var result;

      var ajv = new Ajv();

      ajv[method]({
        id: 'http://example.com/test/person.json#',
        definitions: {
          name: { type: 'string' }
        },
        type: 'object',
        properties: {
          name: { $ref: '#/definitions/name'}
        }
      });

      ajv[method]({
        id: 'http://example.com/test/employee.json#',
        type: 'object',
        properties: {
          person: { $ref: '/test/person.json#' },
          role: { type: 'string' }
        }
      });

      result = ajv.validate('http://example.com/test/employee.json#', {
        person: {
          name: 'Alice'
        },
        role: 'Programmer'
      });

      result. should.equal(true);
      should.equal(ajv.errors, null);
    };
  }
});


describe('issue #182, NaN validation', function() {
  var ajv;

  before(function(){
    ajv = new Ajv();
  });

  it('should not pass minimum/maximum validation', function() {
    testNaN({ minimum: 1 }, false);
    testNaN({ maximum: 1 }, false);
  });

  it('should pass type: number validation', function() {
    testNaN({ type: 'number' }, true);
  });

  it('should not pass type: integer validation', function() {
    testNaN({ type: 'integer' }, false);
  });

  function testNaN(schema, NaNisValid) {
    var validate = new Ajv().compile(schema);
    validate(NaN) .should.equal(NaNisValid);
  }
});


describe('issue #204, options schemas and v5 used together', function() {
  it('should use v5 metaschemas by default', function() {
    var ajv = new Ajv({
      v5: true,
      schemas: [{id: 'str', type: 'string'}],
    });

    var schema = { constant: 42 };
    var validate = ajv.compile(schema);

    validate(42) .should.equal(true);
    validate(43) .should.equal(false);

    ajv.validate('str', 'foo') .should.equal(true);
    ajv.validate('str', 42) .should.equal(false);
  });
});


describe('issue #181, custom keyword is not validated in allErrors mode if there were previous error', function() {
  it('should validate custom keyword that doesn\'t create errors', function() {
    testCustomKeywordErrors({
      type:'object',
      errors: true,
      validate: function v(value) {
        return false;
      }
    });
  });

  it('should validate custom keyword that creates errors', function() {
    testCustomKeywordErrors({
      type:'object',
      errors: true,
      validate: function v(value) {
        v.errors = v.errors || [];
        v.errors.push({
          keyword: 'alwaysFails',
          message: 'alwaysFails error',
          params: {
            keyword: 'alwaysFails'
          }
        });

        return false;
      }
    });
  });

  function testCustomKeywordErrors(def) {
    var ajv = new Ajv({ allErrors: true, beautify: true });

    ajv.addKeyword('alwaysFails', def);

    var schema = {
      required: ['foo'],
      alwaysFails: true
    };

    var validate = ajv.compile(schema);

    validate({ foo: 1 }) .should.equal(false);
    validate.errors .should.have.length(1);
    validate.errors[0].keyword .should.equal('alwaysFails');

    validate({}) .should.equal(false);
    validate.errors .should.have.length(2);
    validate.errors[0].keyword .should.equal('required');
    validate.errors[1].keyword .should.equal('alwaysFails');
  }
});


describe('issue #210, mutual recursive $refs that are schema fragments', function() {
  it('should compile and validate schema when one ref is fragment', function() {
    var ajv = new Ajv;

    ajv.addSchema({
      "id" : "foo",
      "definitions": {
        "bar": {
          "properties": {
            "baz": {
              "anyOf": [
                { "enum": [42] },
                { "$ref": "boo" }
              ]
            }
          }
        }
      }
    });

    ajv.addSchema({
      "id" : "boo",
      "type": "object",
      "required": ["quux"],
      "properties": {
        "quux": { "$ref": "foo#/definitions/bar" }
      }
    });

    var validate = ajv.compile({ "$ref": "foo#/definitions/bar" });

    validate({ baz: { quux: { baz: 42 } } }) .should.equal(true);
    validate({ baz: { quux: { baz: "foo" } } }) .should.equal(false);
  });

  it('should compile and validate schema when both refs are fragments', function() {
    var ajv = new Ajv;

    ajv.addSchema({
      "id" : "foo",
      "definitions": {
        "bar": {
          "properties": {
            "baz": {
              "anyOf": [
                { "enum": [42] },
                { "$ref": "boo#/definitions/buu" }
              ]
            }
          }
        }
      }
    });

    ajv.addSchema({
      "id" : "boo",
      "definitions": {
        "buu": {
          "type": "object",
          "required": ["quux"],
          "properties": {
            "quux": { "$ref": "foo#/definitions/bar" }
          }
        }
      }
    });

    var validate = ajv.compile({ "$ref": "foo#/definitions/bar" });

    validate({ baz: { quux: { baz: 42 } } }) .should.equal(true);
    validate({ baz: { quux: { baz: "foo" } } }) .should.equal(false);
  });
});


describe('issue #240, mutually recursive fragment refs reference a common schema', function() {
  var apiSchema = {
    $schema: 'http://json-schema.org/draft-04/schema#',
    id: 'schema://api.schema#',
    resource: {
      id: '#resource',
      properties: {
        id: { type: 'string' }
      }
    },
    resourceIdentifier: {
      id: '#resource_identifier',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' }
      }
    }
  };

  var domainSchema = {
    $schema: 'http://json-schema.org/draft-04/schema#',
    id: 'schema://domain.schema#',
    properties: {
      data: {
        oneOf: [
          { $ref: 'schema://library.schema#resource_identifier' },
          { $ref: 'schema://catalog_item.schema#resource_identifier' },
        ]
      }
    }
  };

  it('should compile and validate schema when one ref is fragment', function() {
    var ajv = new Ajv;

    var librarySchema = {
      $schema: 'http://json-schema.org/draft-04/schema#',
      id: 'schema://library.schema#',
      properties: {
        name: { type: 'string' },
        links: {
          properties: {
            catalogItems: {
              type: 'array',
              items: { $ref: 'schema://catalog_item_resource_identifier.schema#' }
            }
          }
        }
      },
      definitions: {
        resource_identifier: {
          id: '#resource_identifier',
          allOf: [
            {
              properties: {
                type: {
                  type: 'string',
                  'enum': ['Library']
                }
              }
            },
            { $ref: 'schema://api.schema#resource_identifier' }
          ]
        }
      }
    };

    var catalogItemSchema = {
      $schema: 'http://json-schema.org/draft-04/schema#',
      id: 'schema://catalog_item.schema#',
      properties: {
        name: { type: 'string' },
        links: {
          properties: {
            library: { $ref: 'schema://library.schema#resource_identifier' }
          }
        }
      },
      definitions: {
        resource_identifier: {
          id: '#resource_identifier',
          allOf: [
            {
              properties: {
                type: {
                  type: 'string',
                  'enum': ['CatalogItem']
                }
              }
            },
            { $ref: 'schema://api.schema#resource_identifier' }
          ]
        }
      }
    };

    var catalogItemResourceIdentifierSchema = {
      $schema: 'http://json-schema.org/draft-04/schema#',
      id: 'schema://catalog_item_resource_identifier.schema#',
      allOf: [
        {
          properties: {
            type: {
              type: 'string',
              enum: ['CatalogItem']
            }
          }
        },
        {
          $ref: 'schema://api.schema#resource_identifier'
        }
      ]
    }

    ajv.addSchema(librarySchema);
    ajv.addSchema(catalogItemSchema);
    ajv.addSchema(catalogItemResourceIdentifierSchema)
    ajv.addSchema(apiSchema);

    var validate = ajv.compile(domainSchema);
    testSchema(validate);
  });

  it('should compile and validate schema when both refs are fragments', function() {
    var ajv = new Ajv;

    var librarySchema = {
      $schema: 'http://json-schema.org/draft-04/schema#',
      id: 'schema://library.schema#',
      properties: {
        name: { type: 'string' },
        links: {
          properties: {
            catalogItems: {
              type: 'array',
              items: { $ref: 'schema://catalog_item.schema#resource_identifier' }
            }
          }
        }
      },
      definitions: {
        resource_identifier: {
          id: '#resource_identifier',
          allOf: [
            {
              properties: {
                type: {
                  type: 'string',
                  'enum': ['Library']
                }
              }
            },
            { $ref: 'schema://api.schema#resource_identifier' }
          ]
        }
      }
    };

    var catalogItemSchema = {
      $schema: 'http://json-schema.org/draft-04/schema#',
      id: 'schema://catalog_item.schema#',
      properties: {
        name: { type: 'string' },
        links: {
          properties: {
            library: { $ref: 'schema://library.schema#resource_identifier' }
          }
        }
      },
      definitions: {
        resource_identifier: {
          id: '#resource_identifier',
          allOf: [
            {
              properties: {
                type: {
                  type: 'string',
                  'enum': ['CatalogItem']
                }
              }
            },
            { $ref: 'schema://api.schema#resource_identifier' }
          ]
        }
      }
    };

    ajv.addSchema(librarySchema);
    ajv.addSchema(catalogItemSchema);
    ajv.addSchema(apiSchema);

    var validate = ajv.compile(domainSchema);
    testSchema(validate);
  });


  function testSchema(validate) {
    validate({ data: { type: 'Library', id: '123' } }) .should.equal(true);
    validate({ data: { type: 'Library', id: 123 } }) .should.equal(false);
    validate({ data: { type: 'CatalogItem', id: '123' } }) .should.equal(true);
    validate({ data: { type: 'CatalogItem', id: 123 } }) .should.equal(false);
    validate({ data: { type: 'Foo', id: '123' } }) .should.equal(false);
  }
});
