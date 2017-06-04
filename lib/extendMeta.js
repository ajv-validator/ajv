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
  'const'
];

var extend = module.exports = function (metaSchema, keywordsJsonPointers, opts) {
  var extendWith = [];
  if (opts.$data) extendWith.push({ $ref: 'https://raw.githubusercontent.com/epoberezkin/ajv/master/lib/refs/$data.json#' });
  if (opts.$params) extendWith.push({ $ref: 'https://raw.githubusercontent.com/epoberezkin/ajv/master/lib/refs/$param.json#' });

  for (var i=0; i<keywordsJsonPointers.length; i++) {
    metaSchema = JSON.parse(JSON.stringify(metaSchema));
    var segments = keywordsJsonPointers[i].split('/');
    var keywords = metaSchema;
    var j;
    for (j=1; j<segments.length; j++)
      keywords = keywords[segments[j]];

    for (j=0; j<KEYWORDS.length; j++) {
      var key = KEYWORDS[j];
      var schema = keywords[key];
      if (schema) {
        keywords[key] = {
          anyOf: [schema].concat(extendWith)
        };
      }
    }
  }

  return metaSchema;
};


extend.$data = function (metaSchema, keywordsJsonPointers) {
  console.warn('Ajv.$dataMetaSchema is deprecated. Use Ajv.extendMetaSchema');
  return extend(metaSchema, keywordsJsonPointers, {$data: true});
};
