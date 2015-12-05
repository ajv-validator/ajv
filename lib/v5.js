'use strict';


module.exports = {
  enable: enableV5
};


function enableV5(ajv) {
  ajv.addKeyword('constant', { macro: constantMacro });
  ajv.addKeyword('contains', { macro: containsMacro });
  ajv.addKeyword('formatMaximum', { type: 'string', inline: inlineFormatLimit('maximum') });
  ajv.addKeyword('formatMinimum', { type: 'string', inline: inlineFormatLimit('minimum') });
  ajv.addKeyword('exclusiveFormatMaximum');
  ajv.addKeyword('exclusiveFormatMinimum');
  ajv.addKeyword('patternGroups');
}

function constantMacro(schema) {
  return { enum: [schema] };
}

function containsMacro(schema) {
  return { not: { items: { not: schema } } };
}

function inlineFormatLimit(limit) {
  return function(it, schema, parentSchema) {
    var format = parentSchema.format;
    var compare = it.formats[format].compare;
    if (!compare) throw new Error('No format or no comparison for the format');
    var exclusive = parentSchema[limit == 'minimum' ? 'exclusiveFormatMinimum' : 'exclusiveFormatMaximum'];
    var data = 'data' + (it.dataLevel || '');
    var op = limit == 'minimum' ? '>' : '<';
    if (!exclusive) op += '=';
    return 'formats' + it.util.getProperty(format) + '.compare('
            + data + ', ' + it.util.toQuotedString(schema)
            + ') ' + op + ' 0';
  };
}
