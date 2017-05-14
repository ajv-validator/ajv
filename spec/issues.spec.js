'use strict';

var Ajv = require('./ajv')
  , should = require('./chai').should();


describe('issue #8: schema with shared references', function() {
  it('should be supported by addSchema', spec('addSchema'));

  it('should be supported by compile', spec('compile'));

  function spec(method) {
    return function() {
      var ajv = new Ajv;

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

      result = ajv.validate('obj.json#', { foo: 'abcde', bar: 'fghg' });
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

      var ajv = new Ajv;

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
    var ajv = new Ajv;
    var validate = ajv.compile(schema);
    validate(NaN) .should.equal(NaNisValid);
  }
});


describe('issue #204, options schemas and $data used together', function() {
  it('should use v5 metaschemas by default', function() {
    var ajv = new Ajv({
      schemas: [{id: 'str', type: 'string'}],
      $data: true
    });

    var schema = { const: 42 };
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
      validate: function v(/* value */) {
        return false;
      }
    });
  });

  it('should validate custom keyword that creates errors', function() {
    testCustomKeywordErrors({
      type:'object',
      errors: true,
      validate: function v(/* value */) {
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
    var ajv = new Ajv({ allErrors: true });

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
    $schema: 'http://json-schema.org/draft-06/schema#',
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
    $schema: 'http://json-schema.org/draft-06/schema#',
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
      $schema: 'http://json-schema.org/draft-06/schema#',
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
      $schema: 'http://json-schema.org/draft-06/schema#',
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
      $schema: 'http://json-schema.org/draft-06/schema#',
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
    };

    ajv.addSchema(librarySchema);
    ajv.addSchema(catalogItemSchema);
    ajv.addSchema(catalogItemResourceIdentifierSchema);
    ajv.addSchema(apiSchema);

    var validate = ajv.compile(domainSchema);
    testSchema(validate);
  });

  it('should compile and validate schema when both refs are fragments', function() {
    var ajv = new Ajv;

    var librarySchema = {
      $schema: 'http://json-schema.org/draft-06/schema#',
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
      $schema: 'http://json-schema.org/draft-06/schema#',
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


describe('issue #259, support validating [meta-]schemas against themselves', function() {
  it('should add schema before validation if "id" is the same as "$schema"', function() {
    var ajv = new Ajv;
    ajv.addMetaSchema(require('../lib/refs/json-schema-draft-04.json'));
    var hyperSchema = require('./remotes/hyper-schema.json');
    ajv.addMetaSchema(hyperSchema);
  });
});


describe.skip('issue #273, schemaPath in error in referenced schema', function() {
  it('should have canonic reference with hash after file name', function() {
    test(new Ajv);
    test(new Ajv({inlineRefs: false}));

    function test(ajv) {
      var schema = {
        "properties": {
          "a": { "$ref": "int" }
        }
      };

      var referencedSchema = {
        "id": "int",
        "type": "integer"
      };

      ajv.addSchema(referencedSchema);
      var validate = ajv.compile(schema);

      validate({ "a": "foo" }) .should.equal(false);
      validate.errors[0].schemaPath .should.equal('int#/type');
    }
  });
});


describe('issue #342, support uniqueItems with some non-JSON objects', function() {
  var validate;

  before(function() {
    var ajv = new Ajv;
    validate = ajv.compile({ uniqueItems: true });
  });

  it('should allow different RegExps', function() {
    validate([/foo/, /bar/]) .should.equal(true);
    validate([/foo/ig, /foo/gi]) .should.equal(false);
    validate([/foo/, {}]) .should.equal(true);
  });

  it('should allow different Dates', function() {
    validate([new Date('2016-11-11'), new Date('2016-11-12')]) .should.equal(true);
    validate([new Date('2016-11-11'), new Date('2016-11-11')]) .should.equal(false);
    validate([new Date('2016-11-11'), {}]) .should.equal(true);
  });

  it('should allow undefined properties', function() {
    validate([{}, {foo: undefined}]) .should.equal(true);
    validate([{foo: undefined}, {}]) .should.equal(true);
    validate([{foo: undefined}, {bar: undefined}]) .should.equal(true);
    validate([{foo: undefined}, {foo: undefined}]) .should.equal(false);
  });
});


describe('issue #388, code clean-up not working', function() {
  it('should remove assignement to rootData if it is not used', function() {
    var ajv = new Ajv;
    var validate = ajv.compile({
      type: 'object',
      properties: {
        foo: { type: 'string' }
      }
    });
    var code = validate.toString();
    code.match(/rootData/g).length .should.equal(1);
  });

  it('should remove assignement to errors if they are not used', function() {
    var ajv = new Ajv;
    var validate = ajv.compile({
      type: 'object'
    });
    var code = validate.toString();
    should.equal(code.match(/[^\.]errors|vErrors/g), null);
  });
});


describe('issue #485, order of type validation', function() {
  it('should validate types befor keywords', function() {
    var ajv = new Ajv({allErrors: true});
    var validate = ajv.compile({
      type: ['integer', 'string'],
      required: ['foo'],
      minimum: 2
    });

    validate(2) .should.equal(true);
    validate('foo') .should.equal(true);

    validate(1.5) .should.equal(false);
    checkErrors(['type', 'minimum']);

    validate({}) .should.equal(false);
    checkErrors(['type', 'required']);

    function checkErrors(expectedErrs) {
      validate.errors .should.have.length(expectedErrs.length);
      expectedErrs.forEach(function (keyword, i) {
        validate.errors[i].keyword .should.equal(keyword);
      });
    }
  });

  it('should validate type only once when "type" is "integer"', function() {
    var ajv = new Ajv;
    var validate = ajv.compile({
      type: 'integer',
      minimum: 2
    });
    var code = validate.toString();
    code.match(/typeof\s+/g) .should.have.length(1);
  });
});
