'use strict';

var resolve = require('./resolve')
  , util = require('./util')
  , equal = require('./equal');

try { var beautify = require('' + 'js-beautify').js_beautify; } catch(e) {}

var RULES = require('./rules')
  , validateGenerator = require('../dotjs/validate');

module.exports = compile;


function compile(schema, root, localRefs) {
  /* jshint validthis: true, evil: true */
  var self = this
    , refVal = [ undefined ] 
    , refs = {};

  root = root || { schema: schema, refVal: refVal, refs: refs };

  var formats = this._formats;

  return localCompile(schema, root, localRefs);


  function localCompile(_schema, _root, localRefs) {
    var isRoot = !_root || (_root && _root.schema == _schema);
    if (_root.schema != root.schema)
      return compile.call(self, _schema, _root, localRefs);

    var validateCode = validateGenerator({
      isTop: true,
      schema: _schema,
      isRoot: isRoot, 
      root: _root,
      schemaPath: '',
      errorPath: '""',
      RULES: RULES,
      validate: validateGenerator,
      util: util,
      resolve: resolve,
      resolveRef: resolveRef,
      opts: self.opts,
      formats: formats
    });

    if (self.opts.beautify) {
      var opts = self.opts.beautify === true ? { indent_size: 2 } : self.opts.beautify;
      if (beautify) validateCode = beautify(validateCode, opts);
      else console.error('"npm install js-beautify" to use beautify option');
    }
    // console.log('\n\n\n *** \n', validateCode);
    var validate;
    // try {
      eval(validateCode);
      refVal[0] = validate;
    // } catch(e) {
    //   console.log('Error compiling schema, function code:', validateCode);
    //   throw e;
    // }

    validate.schema = _schema;
    validate.errors = null;
    validate.refs = refs;
    validate.refVal = refVal;
    validate.root = isRoot ? validate : _root;

    return validate;
  }

  function resolveRef(baseId, ref, isRoot) {
    ref = resolve.url(baseId, ref);
    if (refs[ref]) return 'refVal[' + refs[ref] + ']';
    if (!isRoot) {
      var rootRefId = root.refs[ref];
      if (rootRefId !== undefined)
        return addLocalRef(ref, root.refVal[rootRefId]);
    }

    var refCode = addLocalRef(ref);
    var v = resolve.call(self, localCompile, root, ref);
    if (!v) {
      var localSchema = localRefs[ref];
      if (localSchema) v = compile.call(self, localSchema, root, localRefs);
    }

    if (v) {
      replaceLocalRef(ref, v);
      return refCode;
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

var ucs2length = util.ucs2length;
