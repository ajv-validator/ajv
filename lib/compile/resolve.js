'use strict';

var url = require('url')
  , equal = require('./equal');

module.exports = resolve;

resolve.normalizeId = normalizeId;
resolve.fullPath = getFullPath;
resolve.url = resolveUrl;
resolve.ids = resolveIds;
resolve.missing = resolveMissing;


function resolve(compile, rootSchema, ref) {
  ref = normalizeId(ref);
  if (this._refs[ref]) return this._refs[ref];
  if (ref[0] != '#') return;
  var schema = _resolve(rootSchema, ref);
  if (schema) return this._refs[ref] = compile.call(this, schema, rootSchema);
};


function _resolve(rootSchema, ref) {
  var schema = rootSchema
    , parts = ref.split('/');
  for (var i = 1; i < parts.length; i++) {
    if (!schema) break;
    var part = parts[i];
    if (part) {
      part = unescapeFragment(part);
      schema = schema[part];
      if (schema.$ref)
        schema = _resolve(rootSchema, schema.$ref);
    }
  }
  if (schema != rootSchema) return schema;
}


function unescapeFragment(str) {
  return decodeURIComponent(str)
          .replace(/~1/g, '/')
          .replace(/~0/g, '~');
}


function escapeFragment(str) {
  var str = str.replace(/~/g, '~0').replace(/\//g, '~1');
  return encodeURIComponent(str);
}


function getFullPath(id, normalize) {
  if (normalize !== false) id = normalizeId(id);
  var p = url.parse(id, false, true);
  return (p.protocol||'') + (p.protocol?'//':'') + (p.host||'') + (p.path||'') + '#';
}


var TRAILING_SLASH_HASH = /\/?#?\/?$/;
function normalizeId(id) {
    return id ? id.replace(TRAILING_SLASH_HASH, '') : '';
}


function resolveUrl(baseId, id) {
  id = normalizeId(id);
  return url.resolve(baseId, id);
}


function resolveIds(schema) {
  var id = normalizeId(schema.id);
  _resolveIds.call(this, schema, getFullPath(id, false), id);
}


function _resolveIds(schema, fullPath, baseId) {
  if (Array.isArray(schema))
    for (var i=0; i<schema.length; i++)
      _resolveIds.call(this, schema[i], fullPath+'/'+i, baseId);
  else if (schema && typeof schema == 'object') {
    if (typeof schema.id == 'string') {
      var id = baseId = baseId
                        ? url.resolve(baseId, schema.id)
                        : getFullPath(schema.id);

      var refVal = this._refs[id];
      if (typeof refVal == 'string') refVal = this._refs[refVal];
      if (refVal && refVal.schema) {
        if (!equal(schema, refVal.schema))
          throw new Error('id "' + id + '" resolves to more than one schema');
      } else if (id != normalizeId(fullPath))
          this._refs[id] = fullPath;

      // check and resolve missing

    }
    for (var key in schema)
      _resolveIds.call(this, schema[key], fullPath+'/'+escapeFragment(key), baseId);
  }
}


function resolveMissing(schema, schemaRef) {

}
