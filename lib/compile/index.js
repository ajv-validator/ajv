'use strict';

var resolve = require('./resolve')
  , util = require('./util')
  , equal = require('./equal')
  , stableStringify = require('json-stable-stringify');

var beautify = (function() { try { return require('' + 'js-beautify').js_beautify; } catch(e) {} })();

var validateGenerator = require('../dotjs/validate');

module.exports = compile;


function compile(schema, root, localRefs, baseId) {
  /* jshint validthis: true, evil: true */
  var self = this
    , refVal = [ undefined ] 
    , refs = {}
    , patterns = []
    , patternsHash = {}
    , defaults = []
    , defaultsHash = {}
    , customRules = []
    , customRulesHash = {};

  root = root || { schema: schema, refVal: refVal, refs: refs };

  var formats = this._formats;
  var RULES = this.RULES;

  return localCompile(schema, root, localRefs, baseId);


  function localCompile(_schema, _root, localRefs, baseId) {
    var isRoot = !_root || (_root && _root.schema == _schema);
    if (_root.schema != root.schema)
      return compile.call(self, _schema, _root, localRefs, baseId);

    var validateCode = validateGenerator({
      isTop: true,
      schema: _schema,
      isRoot: isRoot,
      baseId: baseId,
      root: _root,
      schemaPath: '',
      errSchemaPath: '#',
      errorPath: '""',
      RULES: RULES,
      validate: validateGenerator,
      util: util,
      resolve: resolve,
      resolveRef: resolveRef,
      usePattern: usePattern,
      useDefault: useDefault,
      useCustomRule: useCustomRule,
      opts: self.opts,
      formats: formats,
      self: self
    });

    validateCode = vars(refVal, refValCode) + vars(patterns, patternCode)
                   + vars(defaults, defaultCode) + vars(customRules, customRuleCode)
                   + validateCode;

    if (self.opts.beautify) {
      var opts = self.opts.beautify === true ? { indent_size: 2 } : self.opts.beautify;
      /* istanbul ignore else */
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

    validate.schema = _schema;
    validate.errors = null;
    validate.refs = refs;
    validate.refVal = refVal;
    validate.root = isRoot ? validate : _root;

    return validate;
  }

  function resolveRef(baseId, ref, isRoot) {
    ref = resolve.url(baseId, ref);
    var refIndex = refs[ref];
    var _refVal, refCode;
    if (refIndex !== undefined) {
      _refVal = refVal[refIndex];
      refCode = 'refVal[' + refIndex + ']';
      return resolvedRef(_refVal, refCode);
    }
    if (!isRoot) {
      var rootRefId = root.refs[ref];
      if (rootRefId !== undefined) {
        _refVal = root.refVal[rootRefId];
        refCode = addLocalRef(ref, _refVal);
        return resolvedRef(_refVal, refCode);
      }
    }

    refCode = addLocalRef(ref);
    var v = resolve.call(self, localCompile, root, ref);
    if (!v) {
      var localSchema = localRefs && localRefs[ref];
      if (localSchema) {
        v = resolve.inlineRef(localSchema, self.opts.inlineRefs)
            ? localSchema
            : compile.call(self, localSchema, root, localRefs, baseId);
      }
    }

    if (v) {
      replaceLocalRef(ref, v);
      return resolvedRef(v, refCode);
    }
  }

  function addLocalRef(ref, v) {
    var refId = refVal.length;
    refVal[refId] = v;
    refs[ref] = refId;
    return 'refVal' + refId;
  }

  function replaceLocalRef(ref, v) {
    var refId = refs[ref];
    refVal[refId] = v;
  }

  function resolvedRef(schema, code) {
    return typeof schema == 'object'
            ? { schema: schema, code: code }
            : code;
  }

  function usePattern(regexStr) {
    var index = patternsHash[regexStr];
    if (index === undefined) {
      index = patternsHash[regexStr] = patterns.length;
      patterns[index] = regexStr;
    }
    return 'pattern' + index;
  }

  function useDefault(value) {
    switch (typeof value) {
      case 'boolean':
      case 'number':
        return '' + value;
      case 'string':
        return util.toQuotedString(value);
      case 'object':
        if (value === null) return 'null';
        var valueStr = stableStringify(value);
        var index = defaultsHash[valueStr];
        if (index === undefined) {
          index = defaultsHash[valueStr] = defaults.length;
          defaults[index] = value;
        }
        return 'default' + index;
    }
  }

  function useCustomRule(rule, schema, parentSchema, it) {
    var compile = rule.definition.compile
      , inline = rule.definition.inline
      , macro = rule.definition.macro;

    var validate;
    if (compile)
      validate = compile.call(self, schema, parentSchema);
    else if (macro) {
      validate = macro.call(self, schema, parentSchema);
      if (self.opts.validateSchema !== false) self.validateSchema(validate, true);
    } else if (inline)
      validate = inline.call(self, it, rule.keyword, schema, parentSchema);
    else
      validate = rule.definition.validate;

    var index = customRules.length;
    customRules[index] = validate;

    return {
      code: 'customRule' + index,
      validate: validate
    };
  }
}


function patternCode(i, patterns) {
  return 'var pattern' + i + ' = new RegExp(' + util.toQuotedString(patterns[i]) + ');';
}


function defaultCode(i) {
  return 'var default' + i + ' = defaults[' + i + '];';
}


function refValCode(i, refVal) {
  return refVal[i] ? 'var refVal' + i + ' = refVal[' + i + '];' : '';
}


function customRuleCode(i) {
  return 'var customRule' + i + ' = customRules[' + i + '];';
}


function vars(arr, statement) {
  if (!arr.length) return '';
  var code = '';
  for (var i=0; i<arr.length; i++)
    code += statement(i, arr);
  return code;
}


/**
 * Functions below are used inside compiled validations function
 */

var ucs2length = util.ucs2length;
