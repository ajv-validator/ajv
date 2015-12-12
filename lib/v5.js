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
  ajv.addKeyword('constant', { macro: constantMacro });
  ajv.addKeyword('contains', { macro: containsMacro });
  ajv.addKeyword('formatMaximum', { type: 'string', inline: formatLimit('maximum'), errors: false });
  ajv.addKeyword('formatMinimum', { type: 'string', inline: formatLimit('minimum'), errors: false });
  ajv.addKeyword('exclusiveFormatMaximum');
  ajv.addKeyword('exclusiveFormatMinimum');
  ajv.addKeyword('patternGroups'); // implemented in properties.jst
  ajv.addKeyword('switch', { inline: require('./dotjs/switch'), statements: true, errors: true });
}

function constantMacro(schema) {
  return { "enum": [schema] };
}

function containsMacro(schema) {
  return {
    "not": {
      "type": "array",
      "items": { "not": schema }
    }
  };
}

function formatLimit(limit) {
  var operation = limit == 'maximum' ? '<' : '>';
  var exclusiveLimit = 'exclusiveFormat' +
                        (limit == 'maximum' ? 'Maximum' : 'Minimum');

  return function(it, schema, parentSchema) {
    var format = parentSchema.format;
    var compare = it.formats[format].compare;
    if (!compare) return 'true';
    var exclusive = parentSchema[exclusiveLimit];
    var data = 'data' + (it.dataLevel || '');
    var op = operation;
    if (!exclusive) op += '=';
    return 'formats' + it.util.getProperty(format) + '.compare('
            + data + ', ' + it.util.toQuotedString(schema)
            + ') ' + op + ' 0';
  };
}
