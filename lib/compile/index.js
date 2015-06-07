'use strict';

var doT = require('dot')
  , fs = require('fs')
  , formats = require('./formats')
  , resolve = require('./resolve')
  , util = require('./util')
  , equal = require('./equal');

try { var beautify = require('js-beautify').js_beautify; } catch(e) {}

var RULES = require('./rules')
  , validateTemplate = fs.readFileSync(__dirname + '/validate.dot.js')
  , validateGenerator = doT.compile(validateTemplate, { definitions: RULES.defs });

module.exports = compile;


function compile(schema, _rootSchema) {
  var self = this, refVal = [], refs = {};
  _rootSchema = _rootSchema || schema;

  var validateCode = validateGenerator({
    isRoot: true,
    schema: schema,
    schemaPath: '',
    errorPath: '""',
    dataPath: '',
    RULES: RULES,
    validate: validateGenerator,
    util: util,
    resolve: resolve,
    resolveRef: resolveRef,
    opts: this.opts
  });

  if (this.opts.beautify) {
    var opts = this.opts.beautify === true ? { indent_size: 2 } : this.opts.beautify;
    if (beautify) validateCode = beautify(validateCode, opts);
    else console.error('"npm install js-beautify" to use beautify option');
  }
  // console.log('\n\n\n *** \n', validateCode);
  var validate;
  eval(validateCode);

  validate.schema = schema;
  validate.errors = [];

  return validate;

  function resolveRef(baseId, ref) {
    // ref = resolve.url(baseId, ref);
    if (refs[ref]) return refs[ref];
    var v = resolve.call(self, compile, _rootSchema, ref);
    if (v) {
      var refId = refVal.length;
      refVal.push(v);
      refs[ref] = refId;
      return refId;
    } else {
      // register missing ref, create empty entry in refs and return id
    }
  }
}


/**
 * Functions below are used inside compiled validations function
 */

var getProperty = util.getProperty
  , ucs2length = util.ucs2length
  , stableStringify = util.stableStringify;
