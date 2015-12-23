'use strict';

var META_SCHEMA_ID = 'https://raw.githubusercontent.com/epoberezkin/ajv/master/lib/refs/json-schema-v5.json';

module.exports = {
  enable: enableV5,
  META_SCHEMA_ID: META_SCHEMA_ID
};


function enableV5(ajv) {
  if (ajv.opts.meta !== false) {
    var metaSchema = require('./refs/json-schema-v5.json');
    ajv.addMetaSchema(metaSchema, META_SCHEMA_ID);
  }
  ajv.addKeyword('constant', { inline: require('./dotjs/constant'), statements: true, errors: 'full' });
  ajv.addKeyword('contains', { macro: containsMacro });
  ajv.addKeyword('formatMaximum', { type: 'string', inline: formatLimit, errors: false });
  ajv.addKeyword('formatMinimum', { type: 'string', inline: formatLimit, errors: false });
  ajv.addKeyword('exclusiveFormatMaximum');
  ajv.addKeyword('exclusiveFormatMinimum');
  ajv.addKeyword('patternGroups'); // implemented in properties.jst
  ajv.addKeyword('switch', { inline: require('./dotjs/switch'), statements: true, errors: 'full' });
}

function containsMacro(schema) {
  return {
    "not": {
      "type": "array",
      "items": { "not": schema }
    }
  };
}

function formatLimit(it, keyword, schema, parentSchema) {
  var isMax = keyword == 'formatMaximum'
    , operation = isMax ? '<' : '>'
    , exclusiveLimit = 'exclusiveFormat' + (isMax ? 'Maximum' : 'Minimum')
    , format = parentSchema.format
    , compare = it.formats[format].compare;
  if (!compare) return 'true';
  var exclusive = parentSchema[exclusiveLimit]
    , data = 'data' + (it.dataLevel || '')
    , op = operation;
  if (!exclusive) op += '=';
  return 'formats' + it.util.getProperty(format) + '.compare('
          + data + ', ' + it.util.toQuotedString(schema)
          + ') ' + op + ' 0';
}
