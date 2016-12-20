'use strict';

module.exports = function (ajv) {
  console.warn('keyword "patternGroups" is deprecated. It will be removed in v6.0.0 (unless it is added to JSON-schema standard).');
  ajv.addKeyword('patternGroups', {
    // implemented in properties.jst
    metaSchema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: [ 'schema' ],
        properties: {
          maximum: {
            type: 'integer',
            minimum: 0
          },
          minimum: {
            type: 'integer',
            minimum: 0
          },
          schema: { $ref: 'http://json-schema.org/draft-04/schema#' }
        },
        additionalProperties: false
      }
    }
  });
  ajv.RULES.all.properties.implements.push('patternGroups');
};
