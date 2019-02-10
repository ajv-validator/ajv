'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #521, incorrect warning with "id" property', function() {
  it('should not log warning', function() {
    var ajv = new Ajv({schemaId: '$id'});
    var consoleWarn = console.warn;
    console.warn = function() {
      throw new Error('should not log warning');
    };

    try {
      ajv.compile({
        "$id": "http://example.com/schema.json",
        "type": "object",
        "properties": {
          "id": {"type": "string"},
        },
        "required": [ "id"]
      });
    } finally {
      console.warn = consoleWarn;
    }
  });
});
