'use strict';


module.exports = function resolve(compile, rootSchema, ref) {
  if (this._schemas[ref]) return this._schemas[ref];
  if (ref[0] != '#') return;
  var schema = _resolve(rootSchema, ref);
  if (schema) return this._schemas[ref] = compile.call(this, schema, rootSchema);
};


function _resolve(rootSchema, ref) {
  var schema = rootSchema
    , parts = ref.split('/');
  for (var i = 1; i < parts.length; i++) {
    if (!schema) break;
    var part = unescape(parts[i]);
    schema = schema[part];
    if (schema.$ref)
      schema = _resolve(rootSchema, schema.$ref);
  }
  if (schema != rootSchema) return schema;
}


function unescape(str) {
  return decodeURIComponent(str)
          .replace(/~1/g, '/')
          .replace(/~0/g, '~');
}
