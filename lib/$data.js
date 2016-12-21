'use strict';

var KEYWORDS = [
  'multipleOf',
  'maximum',
  'exclusiveMaximum',
  'minimum',
  'exclusiveMinimum',
  'maxLength',
  'minLength',
  'pattern',
  'additionalItems',
  'maxItems',
  'minItems',
  'uniqueItems',
  'maxProperties',
  'minProperties',
  'required',
  'additionalProperties',
  'enum',
  'format',
  'constant'
];

module.exports = function (metaSchema, keywordsJsonPointer) {
  metaSchema = JSON.parse(JSON.stringify(metaSchema));
  var segments = keywordsJsonPointer.split('/');
  var keywords = metaSchema;
  var i;
  for (i=1; i<segments.length; i++)
    keywords = keywords[segments[i]];

  for (i=0; i<KEYWORDS.length; i++) {
    var key = KEYWORDS[i];
    var schema = keywords[key];
    if (schema) {
      keywords[key] = {
        anyOf: [
          schema,
          { $ref: 'https://raw.githubusercontent.com/epoberezkin/ajv/master/lib/refs/$data.json#' }
        ]
      };
    }
  }

  return metaSchema;
};
