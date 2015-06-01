module.exports = function (it) {
  var out = 'var anyOf_errs = validate.errors.length; \n'
  out += 'var valid = false; \n';
  var closingBraces = '';
  var _it = it.copy(it);

  var schema = it.schema.anyOf;
  for (var i=0; i<schema.length; i++) {
    var _schema = schema[i];
    if (i) {
      closingBraces += '}';
      out += 'if (!valid) { \n';
    }
    _it.schema = _schema;
    _it.schemaPath = it.schemaPath + '.anyOf[' + i + ']';
    out += 'valid = valid || (' + it.validate(_it) + ')(data, dataPath); \n';
  }
  out += closingBraces + '\n if (valid) validate.errors.length = anyOf_errs;';
  return out;
}
