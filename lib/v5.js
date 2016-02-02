'use strict';

var META_SCHEMA_ID = 'https://raw.githubusercontent.com/epoberezkin/ajv/master/lib/refs/json-schema-v5.json';

module.exports = {
  enable: enableV5,
  META_SCHEMA_ID: META_SCHEMA_ID
};


function enableV5(ajv) {
  if (ajv._opts.meta !== false) {
    var metaSchema = require('./refs/json-schema-v5.json');
    ajv.addMetaSchema(metaSchema, META_SCHEMA_ID);
  }
  ajv.addKeyword('constant', { inline: require('./dotjs/constant'), statements: true, errors: 'full' });
  ajv.addKeyword('contains', { type: 'array', macro: containsMacro });

  var formatLimit = require('./dotjs/_formatLimit');
  ajv.addKeyword('formatMaximum', { type: 'string', inline: formatLimit, statements: true, errors: 'full' });
  ajv.addKeyword('formatMinimum', { type: 'string', inline: formatLimit, statements: true, errors: 'full' });
  ajv.addKeyword('exclusiveFormatMaximum');
  ajv.addKeyword('exclusiveFormatMinimum');

  ajv.addKeyword('patternGroups'); // implemented in properties.jst
  ajv.addKeyword('switch', { inline: require('./dotjs/switch'), statements: true, errors: 'full' });
}

function containsMacro(schema) {
  return {
    not: { items: { not: schema } }
  };
}
