module.exports = function (it) {
  var out = 'var valid = true; \n';
  var closingBraces = '';
  var _it = it.copy(it);
  
  var schema = it.schema.allOf
  for (var i=0; i<schema.length; i++) {
    var _schema = schema[i];
    if (!it.opts.allErrors && i) {
      closingBraces += '}';
      out += 'if (valid) { \n';
    }
    _it.schema = _schema;
    _it.schemaPath = it.schemaPath + '.allOf[' + i + ']';
    out += 'valid = valid && (' + it.validate(_it) + ')(data, dataPath); \n';
  }
  
  return out + closingBraces + '\n';
}
