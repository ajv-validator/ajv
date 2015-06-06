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


function compile(schema) {
  var self = this;
  var validateCode = validateGenerator({
    isRoot: true,
    schema: schema,
    schemaPath: '',
    errorPath: '""',
    dataPath: '',
    RULES: RULES,
    validate: validateGenerator,
    util: util,
    resolveRef: resolveRef,
    opts: this.opts
  });

  if (this.opts.beautify) {
    if (beautify) validateCode = beautify(validateCode, { indent_size: 2 });
    else console.error('"npm install js-beautify" to use beautify option');
  }
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

var getProperty = util.getProperty
  , ucs2length = util.ucs2length
  , stableStringify = util.stableStringify;
