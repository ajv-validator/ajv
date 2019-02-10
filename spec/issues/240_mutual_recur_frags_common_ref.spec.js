'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #240, mutually recursive fragment refs reference a common schema', function() {
  var apiSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'schema://api.schema#',
    resource: {
      $id: '#resource',
      properties: {
        id: { type: 'string' }
      }
    },
    resourceIdentifier: {
      $id: '#resource_identifier',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' }
      }
    }
  };

  var domainSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'schema://domain.schema#',
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
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'schema://library.schema#',
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
          $id: '#resource_identifier',
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
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'schema://catalog_item.schema#',
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
          $id: '#resource_identifier',
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
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'schema://catalog_item_resource_identifier.schema#',
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
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'schema://library.schema#',
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
          $id: '#resource_identifier',
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
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'schema://catalog_item.schema#',
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
          $id: '#resource_identifier',
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
