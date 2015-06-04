'use strict';


module.exports = function resolve(compile, rootSchema, ref) {
  var schema = rootSchema;
  if (ref[0] != '#')
    schema = undefined;
  else if (ref != '#') {
    if (this._schemas[ref])
      schema = this._schemas[ref];
    else {
      var parts = ref.split('/');
      for (var i = 1; i < parts.length; i++) {
        if (!schema) break;
        var part = unescape(parts[i]);
        schema = schema[part];
        if (schema.$ref)
          schema = resolve.call(this, compile, rootSchema, schema.$ref);
      }
      if (schema) this._schemas[ref] = compile.call(this, schema);
    }
  }
  return schema;
};


function unescape(str) {
  return decodeURIComponent(str)
          .replace(/~1/g, '/')
          .replace(/~0/g, '~');
}
