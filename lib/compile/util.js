'use strict';


module.exports = {
    copy: copy,
    checkDataType: checkDataType,
    checkDataTypes: checkDataTypes,
    toHash: toHash,
    getProperty: getProperty,
    escapeQuotes: escapeQuotes,
    escapeRegExp: escapeRegExp,
    ucs2length: ucs2length,
    stableStringify: require('json-stable-stringify')
};


function copy(o, to) {
  to = to || {};
  for (var key in o) to[key] = o[key];
  return to;
}


function checkDataType(dataType, data) {
  // var data = 'data' + (lvl || '');
  switch (dataType) {
    case 'null': return data + ' === null';
    case 'array': return 'Array.isArray(' + data + ')';
    case 'object': return '(' + data + ' && typeof ' + data + ' == "object" && !Array.isArray(' + data + '))';
    case 'integer': return '(typeof ' + data + ' == "number" && !(' + data + ' % 1))'
    default: return 'typeof ' + data + ' == "' + dataType + '"';
  }
}


function checkDataTypes(dataTypes, data) {
  // var data = 'data' + (lvl || '');
  switch (dataTypes.length) {
    case 0: return 'true';
    case 1: return checkDataType(dataTypes[0], data);
    default:
      var code = ''
      var types = toHash(dataTypes);
      if (types.array && types.object) {
        code = types.null ? '(': '(' + data + ' && '
        code += 'typeof ' + data + ' == "object")';
        delete types.null;
        delete types.array;
        delete types.object;
      }
      if (types.number) delete types.integer;
      for (var t in types)
        code += (code ? '||' : '' ) + checkDataType(t, data);

      return code;
  }
}


function toHash(arr, func) {
  var hash = {};
  arr.forEach(function (item) {
    if (func) item = func(item);
    hash[item] = true;
  });
  return hash;
}


var IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
function getProperty(key) {
  return IDENTIFIER.test(key)
          ? '.' + key
          : "['" + key + "']";
}


function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}


var ESCAPE_REGEXP = /[\/]/g
function escapeRegExp(str) {
  return str.replace(ESCAPE_REGEXP, '\\$&');
}


// https://mathiasbynens.be/notes/javascript-encoding
// https://github.com/bestiejs/punycode.js - punycode.ucs2.decode
function ucs2length(str) {
  var length = 0
    , len = str.length
    , pos = 0
    , value;
  while (pos < len) {
    length++;
    value = str.charCodeAt(pos++);
    if (value >= 0xD800 && value <= 0xDBFF && pos < len) {
      // high surrogate, and there is a next character
      value = str.charCodeAt(pos);
      if ((value & 0xFC00) == 0xDC00) pos++; // low surrogate
    }
  }
  return length;
}
