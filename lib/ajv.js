'use strict';

var compileSchema = require('./compile')
  , resolve = require('./compile/resolve')
  , Cache = require('./cache')
  , SchemaObject = require('./compile/schema_obj')
  , stableStringify = require('json-stable-stringify')
  , formats = require('./compile/formats')
  , rules = require('./compile/rules')
  , v5 = require('./v5');

module.exports = Ajv;

Ajv.prototype.compileAsync = require('./async');
Ajv.prototype.addKeyword = require('./keyword');

var META_SCHEMA_ID = 'http://json-schema.org/draft-04/schema';
var SCHEMA_URI_FORMAT = /^(?:(?:[a-z][a-z0-9+-.]*:)?\/\/)?[^\s]*$/i;
function SCHEMA_URI_FORMAT_FUNC(str) {
  return SCHEMA_URI_FORMAT.test(str);
}

/**
 * Creates validator instance.
 * Usage: `Ajv(opts)`
 * @param {Object} opts optional options
 * @return {Object} ajv instance
 */
function Ajv(opts) {
  if (!(this instanceof Ajv)) return new Ajv(opts);
  var self = this;

  this.opts = opts || {};
  this._schemas = {};
  this._refs = {};
  this._formats = formats(this.opts.format);
  this._cache = this.opts.cache || new Cache;
  this._loadingSchemas = {};
  this.RULES = rules();

  // this is done on purpose, so that methods are bound to the instance
  // (without using bind) so that they can be used without the instance
  this.validate = validate;
  this.compile = compile;
  this.addSchema = addSchema;
  this.addMetaSchema = addMetaSchema;
  this.validateSchema = validateSchema;
  this.getSchema = getSchema;
  this.removeSchema = removeSchema;
  this.addFormat = addFormat;
  this.errorsText = errorsText;

  this._addSchema = _addSchema;
  this._compile = _compile;

  addInitialSchemas();
  if (this.opts.formats) addInitialFormats();

  if (this.opts.errorDataPath == 'property')
    this.opts._errorDataPathProperty = true;

  if (this.opts.v5) v5.enable(this);


  /**
   * Validate data using schema
   * Schema will be compiled and cached (using serialized JSON as key. [json-stable-stringify](https://github.com/substack/json-stable-stringify) is used to serialize.
   * @param  {String|Object} schemaKeyRef key, ref or schema object
   * @param  {Any} data to be validated
   * @return {Boolean} validation result. Errors from the last validation will be available in `ajv.errors` (and also in compiled schema: `schema.errors`).
   */
  function validate(schemaKeyRef, data) {
    var v;
    if (typeof schemaKeyRef == 'string') {
      v = getSchema(schemaKeyRef);
      if (!v) throw new Error('no schema with key or ref "' + schemaKeyRef + '"');
    } else {
      var schemaObj = _addSchema(schemaKeyRef);
      v = schemaObj.validate || _compile(schemaObj);
    }

    var valid = v(data);
    self.errors = v.errors;
    return valid;
  }


  /**
   * Create validating function for passed schema.
   * @param  {String|Object} schema
   * @return {Function} validating function
   */
  function compile(schema) {
    var schemaObj = _addSchema(schema);
    return schemaObj.validate || _compile(schemaObj);
  }


  /**
   * Adds schema to the instance.
   * @param {Object|Array} schema schema or array of schemas. If array is passed, `key` will be ignored.
   * @param {String} key Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
   */
  function addSchema(schema, key, _skipValidation, _meta) {
    if (Array.isArray(schema)){
      for (var i=0; i<schema.length; i++) addSchema(schema[i]);
      return;
    }
    // can key/id have # inside?
    key = resolve.normalizeId(key || schema.id);
    checkUnique(key);
    var schemaObj = self._schemas[key] = _addSchema(schema, _skipValidation);
    schemaObj.meta = _meta;
  }


  /**
   * Add schema that will be used to validate other schemas
   * removeAdditional option is alway set to false
   * @param {Object} schema
   * @param {String} key optional schema key
   */
  function addMetaSchema(schema, key, _skipValidation) {
    addSchema(schema, key, _skipValidation, true);
  }


  /**
   * Validate schema
   * @param {Object} schema schema to validate
   * @param {Boolean} throwOrLogError pass true to throw on error
   * @return {Boolean}
   */
  function validateSchema(schema, throwOrLogError) {
    var $schema = schema.$schema || META_SCHEMA_ID;
    var currentUriFormat = self._formats.uri;
    self._formats.uri = typeof currentUriFormat == 'function'
                        ? SCHEMA_URI_FORMAT_FUNC
                        : SCHEMA_URI_FORMAT;
    var valid = validate($schema, schema);
    self._formats.uri = currentUriFormat;
    if (!valid && throwOrLogError) {
      var message = 'schema is invalid:' + errorsText();
      if (self.opts.validateSchema == 'log') console.error(message);
      else throw new Error(message);
    }
    return valid;
  }


  /**
   * Get compiled schema from the instance by `key` or `ref`.
   * @param  {String} keyRef `key` that was passed to `addSchema` or full schema reference (`schema.id` or resolved id).
   * @return {Function} schema validating function (with property `schema`).
   */
  function getSchema(keyRef) {
    var schemaObj = _getSchemaObj(keyRef);
    switch (typeof schemaObj) {
      case 'object': return schemaObj.validate || _compile(schemaObj);
      case 'string': return getSchema(schemaObj);
    }
  }


  function _getSchemaObj(keyRef) {
    keyRef = resolve.normalizeId(keyRef);
    return self._schemas[keyRef] || self._refs[keyRef];
  }


  /**
   * Remove cached schema
   * Even if schema is referenced by other schemas it still can be removed as other schemas have local references
   * @param  {String|Object} schemaKeyRef key, ref or schema object
   */
  function removeSchema(schemaKeyRef) {
    switch (typeof schemaKeyRef) {
      case 'string':
        var schemaObj = _getSchemaObj(schemaKeyRef);
        self._cache.del(schemaObj.jsonStr);
        delete self._schemas[schemaKeyRef];
        delete self._refs[schemaKeyRef];
        break;
      case 'object':
        var jsonStr = stableStringify(schemaKeyRef);
        self._cache.del(jsonStr);
        var id = schemaKeyRef.id;
        if (id) {
          id = resolve.normalizeId(id);
          delete self._refs[id];
        }
    }
  }


  function _addSchema(schema, skipValidation) {
    if (typeof schema != 'object') throw new Error('schema should be object');
    var jsonStr = stableStringify(schema);
    var cached = self._cache.get(jsonStr);
    if (cached) return cached;

    var id = resolve.normalizeId(schema.id);
    if (id) checkUnique(id);

    if (self.opts.validateSchema !== false && !skipValidation)
      validateSchema(schema, true);

    var localRefs = resolve.ids.call(self, schema);

    var schemaObj = new SchemaObject({
      id: id,
      schema: schema,
      localRefs: localRefs,
      jsonStr: jsonStr,
    });

    if (id[0] != '#') self._refs[id] = schemaObj;
    self._cache.put(jsonStr, schemaObj);

    return schemaObj;
  }


  function _compile(schemaObj, root) {
    if (schemaObj.compiling) {
      schemaObj.validate = callValidate;
      callValidate.schema = schemaObj.schema;
      callValidate.errors = null;
      callValidate.root = root ? root : callValidate;
      return callValidate;
    }
    schemaObj.compiling = true;

    var currentRA = self.opts.removeAdditional;
    if (currentRA && schemaObj.meta) self.opts.removeAdditional = false;
    var v;
    try { v = compileSchema.call(self, schemaObj.schema, root, schemaObj.localRefs); }
    finally {
      schemaObj.compiling = false;
      if (currentRA) self.opts.removeAdditional = currentRA;
    }

    schemaObj.validate = v;
    schemaObj.refs = v.refs;
    schemaObj.refVal = v.refVal;
    schemaObj.root = v.root;
    return v;


    function callValidate() {
      var v = schemaObj.validate;
      var result = v.apply(null, arguments);
      callValidate.errors = v.errors;
      return result;
    }
  }


  /**
   * Convert array of error message objects to string
   * @param  {Array<Object>} errors optional array of validation errors, if not passed errors from the instance are used.
   * @param  {Object} opts optional options with properties `separator` and `dataVar`.
   * @return {String}
   */
  function errorsText(errors, opts) {
    errors = errors || self.errors;
    if (!errors) return 'No errors';
    opts = opts || {};
    var separator = opts.separator || ', ';
    var dataVar = opts.dataVar || 'data';

    var text = '';
    for (var i=0; i<errors.length; i++) {
      var e = errors[i];
      if (e) text += dataVar + e.dataPath + ' ' + e.message + separator;
    }
    return text.slice(0, -separator.length);
  }


  /**
   * Add custom format
   * @param {String} name format name
   * @param {String|RegExp|Function} format string is converted to RegExp; function should return boolean (true when valid)
   */
  function addFormat(name, format) {
    if (typeof format == 'string') format = new RegExp(format);
    self._formats[name] = format;
  }


  function addInitialSchemas() {
    if (self.opts.meta !== false) {
      var metaSchema = require('./refs/json-schema-draft-04.json');
      addMetaSchema(metaSchema, META_SCHEMA_ID, true);
      self._refs['http://json-schema.org/schema'] = META_SCHEMA_ID;
    }

    var optsSchemas = self.opts.schemas;
    if (!optsSchemas) return;
    if (Array.isArray(optsSchemas)) addSchema(optsSchemas);
    else for (var key in optsSchemas) addSchema(optsSchemas[key], key);
  }


  function addInitialFormats() {
    for (var name in self.opts.formats) {
      var format = self.opts.formats[name];
      addFormat(name, format);
    }
  }


  function checkUnique(id) {
    if (self._schemas[id] || self._refs[id])
      throw new Error('schema with key or id "' + id + '" already exists');
  }
}
