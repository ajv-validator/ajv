'use strict';

var resolve = require('./resolve')
  , util = require('./util')
  , equal = require('./equal');

try { var beautify = require('' + 'js-beautify').js_beautify; } catch(e) {}

var RULES = require('./rules')
  , validateGenerator = require('../dotjs/validate');

module.exports = compile;


function compile(schema, root, localRefs) {
  var self = this
    , refVal = [ undefined ] 
    , refs = {};

  var isRoot = !root || (root && root.schema == schema);
  root = root || { schema: schema, refVal: refVal, refs: refs };
  var rootRefs = root.refs;
  var rootRefVal = root.refVal;

  var formats = this._formats;

  var validateCode = validateGenerator({
    isTop: true,
    schema: schema,
    isRoot: isRoot, 
    root: root,
    schemaPath: '',
    errorPath: '""',
    dataPath: '',
    RULES: RULES,
    validate: validateGenerator,
    util: util,
    resolve: resolve,
    resolveRef: resolveRef,
    opts: this.opts,
    formats: formats
  });

  if (this.opts.beautify) {
    var opts = this.opts.beautify === true ? { indent_size: 2 } : this.opts.beautify;
    if (beautify) validateCode = beautify(validateCode, opts);
    else console.error('"npm install js-beautify" to use beautify option');
  }
  // console.log('\n\n\n *** \n', validateCode);
  var validate;
  try {
    eval(validateCode);
    refVal[0] = validate;
  } catch(e) {
    console.log('Error compiling schema, function code:', validateCode);
    throw e;
  }

  validate.schema = schema;
  validate.errors = null;
  validate.refs = refs;
  validate.refVal = refVal;
  validate.root = isRoot ? validate : root;

  return validate;


  function resolveRef(baseId, ref) {
    ref = resolve.url(baseId, ref);
    if (refs[ref]) return 'refVal[' + refs[ref] + ']';
    if (!isRoot) {
      var rootRefId = rootRefs[ref];
      if (rootRefId !== undefined)
        return addLocalRef(ref, rootRefVal[rootRefId]);
    }

    var refCode = addLocalRef(ref, compiledRef);
    var v = resolve.call(self, compile, root, ref);
    if (!v) {
      var localSchema = localRefs[ref];
      if (localSchema) v = compile.call(self, localSchema, root, localRefs);
    }

    if (v) {
      replaceLocalRef(ref, v);
      return refCode;
    }

    function compiledRef() {
      var valid = v.apply(this, arguments);
      compiledRef.errors = v.errors;
      return valid;
    }
  }

  function addLocalRef(ref, v) {
    var refId = refVal.length;
    refVal[refId] = v;
    refs[ref] = refId;
    return 'refVal[' + refId + ']';
  }

  function replaceLocalRef(ref, v) {
    var refId = refs[ref];
    refVal[refId] = v;
  }
}


/**
 * Functions below are used inside compiled validations function
 */

var getProperty = util.getProperty
  , ucs2length = util.ucs2length
  , stableStringify = util.stableStringify;
