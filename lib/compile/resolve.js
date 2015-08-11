'use strict';

var url = require('url')
  , equal = require('./equal')
  , util = require('./util');

module.exports = resolve;

resolve.normalizeId = normalizeId;
resolve.fullPath = getFullPath;
resolve.url = resolveUrl;
resolve.ids = resolveIds;


function resolve(compile, root, ref) {
  /* jshint validthis: true */
  var refVal = this._refs[ref];
  if (typeof refVal == 'string') {
    if (this._refs[refVal]) refVal = this._refs[refVal];
    else return resolve.call(this, compile, root, refVal);
  }
  refVal = refVal || this._schemas[ref];
  if (typeof refVal == 'function') return refVal;
  var res = _resolve.call(this, root, ref);
  var schema, v;
  if (res) {
    schema = res.schema;
    root = res.root;
  }
  if (typeof schema == 'function') v = schema;
  else if (schema) v = compile.call(this, schema, root);
  if (v && ref[0] != '#') this._refs[ref] = v;
  return v;
}


function _resolve(root, ref) {
  /* jshint validthis: true */
  var p = url.parse(ref, false, true)
    , refPath = _getFullPath(p)
    , baseId = getFullPath(root.schema.id);
  if (refPath !== baseId) {
    var id = normalizeId(refPath);
    var refVal = this._refs[id];
    if (typeof refVal == 'string') refVal = this._refs[refVal];
    if (typeof refVal == 'function') root = refVal;
    else {
      refVal = this._schemas[id];
      if (typeof refVal == 'function') {
        if (id == normalizeId(ref)) return { schema: refVal, root: root };
        root = refVal;
      }
    }
    if (!root.schema) return;
    baseId = getFullPath(root.schema.id);
  }
  return getJsonPointer.call(this, p, baseId, root);
}


function getJsonPointer(parsedRef, baseId, root) {
  /* jshint validthis: true */
  parsedRef.hash = parsedRef.hash || '';
  if (parsedRef.hash.slice(0,2) != '#/') return;
  var parts = parsedRef.hash.split('/');
  var schema = root.schema;

  for (var i = 1; i < parts.length; i++) {
    var part = parts[i];
    if (part) {
      part = unescapeFragment(part);
      schema = schema[part];
      if (!schema) break;
      if (schema.id) baseId = resolveUrl(baseId, schema.id);
      if (schema.$ref) {
        var $ref = resolveUrl(baseId, schema.$ref);
        var res = _resolve.call(this, root, $ref);
        if (res) {
          schema = res.schema;
          root = res.root;
        }
      }
    }
  }
  if (schema && schema != root.schema) return { schema: schema, root: root };
}


function unescapeFragment(str) {
  return decodeURIComponent(str)
          .replace(/~1/g, '/')
          .replace(/~0/g, '~');
}


function escapeFragment(str) {
  str = str.replace(/~/g, '~0').replace(/\//g, '~1');
  return encodeURIComponent(str);
}


function getFullPath(id, normalize) {
  if (normalize !== false) id = normalizeId(id);
  var p = url.parse(id, false, true);
  return _getFullPath(p);
}


function _getFullPath(p) {
  return (p.protocol||'') + (p.protocol?'//':'') + (p.host||'') + (p.path||'')  + '#';
}


var TRAILING_SLASH_HASH = /#\/?$/;
function normalizeId(id) {
    return id ? id.replace(TRAILING_SLASH_HASH, '') : '';
}


function resolveUrl(baseId, id) {
  id = normalizeId(id);
  return url.resolve(baseId, id);
}


function resolveIds(schema) {
  /* jshint validthis: true */
  var id = normalizeId(schema.id);
  var localRefs = {};
  _resolveIds.call(this, schema, getFullPath(id, false), id);
  return localRefs;

  function _resolveIds(schema, fullPath, baseId) {
    /* jshint validthis: true */
    if (Array.isArray(schema))
      for (var i=0; i<schema.length; i++)
        _resolveIds.call(this, schema[i], fullPath+'/'+i, baseId);
    else if (schema && typeof schema == 'object') {
      if (typeof schema.id == 'string') {
        var id = baseId = baseId
                          ? url.resolve(baseId, schema.id)
                          : normalizeId(schema.id);

        var refVal = this._refs[id];
        if (typeof refVal == 'string') refVal = this._refs[refVal];
        if (refVal && refVal.schema) {
          if (!equal(schema, refVal.schema))
            throw new Error('id "' + id + '" resolves to more than one schema');
        } else if (id != normalizeId(fullPath)) {
          if (id[0] == '#') {
            if (localRefs[id] && !equal(schema, localRefs[id]))
              throw new Error('id "' + id + '" resolves to more than one schema');
            localRefs[id] = schema;
          } else
            this._refs[id] = fullPath;
        }
      }
      for (var key in schema)
        _resolveIds.call(this, schema[key], fullPath+'/'+escapeFragment(key), baseId);
    }
  }
}
