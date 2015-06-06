'use strict';

var doT = require('dot')
  , fs = require('fs')
  , stableStringify = require('json-stable-stringify')
  , formats = require('./formats')
  , resolve = require('./resolve')
  , equal = require('./equal');

var RULES = require('./rules')
  , validateTemplate = fs.readFileSync(__dirname + '/validate.dot.js')
  , validateGenerator = doT.compile(validateTemplate);

module.exports = compile;


function compile(schema) {
  var self = this;
  var validateCode = validateGenerator({
    isRoot: true,
    schema: schema,
    schemaPath: '',
    path: '""',
    RULES: RULES,
    validate: validateGenerator,
    copy: copy,
    toHash: toHash,
    property: property,
    resolveRef: resolveRef,
    checkDataType: checkDataType,
    checkDataTypes: checkDataTypes,
    escapeQuotes: escapeQuotes,
    stableStringify: stableStringify,
    opts: this.opts
  });
  // console.log('\n\n\n *** \n', validateCode);
  var validate;
  eval(validateCode);

  validate.schema = schema;
  validate.errors = [];

  return validate;

  function resolveRef(ref) {
    return resolve.call(self, compile, schema, ref);
  }

  function validateRef(ref, data) {
    var v = ref == '#' ? validate : self._schemas[ref];
    var valid = v(data);
    return { valid: valid, errors: v.errors };
  }
}


/**
 * Functions below are used inside compiled validations function
 */


function copy(o, to) {
  to = to || {};
  for (var key in o) to[key] = o[key];
  return to;
}


var IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
function property(key) {
  return IDENTIFIER.test(key)
          ? '.' + key
          : "['" + key + "']";
}


function checkDataType(dataType, lvl) {
  var data = 'data' + lvl;
  switch (dataType) {
    case 'null': return data + ' === null';
    case 'array': return 'Array.isArray(' + data + ')';
    case 'object': return '(' + data + ' && typeof ' + data + ' == "object" && !Array.isArray(' + data + '))';
    case 'integer': return '(typeof ' + data + ' == "number" && !(' + data + ' % 1))'
    default: return 'typeof ' + data + ' == "' + dataType + '"';
  }
}


function checkDataTypes(dataTypes, lvl) {
  var data = 'data' + lvl;
  switch (dataTypes.length) {
    case 0: return 'true';
    case 1: return checkDataType(dataTypes[0], lvl);
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
        code += (code ? '||' : '' ) + checkDataType(t, lvl);

      return code;
  }
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


function toHash(arr, func) {
  var hash = {};
  arr.forEach(function (item) {
    if (func) item = func(item);
    hash[item] = true;
  });
  return hash;
}


function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}
