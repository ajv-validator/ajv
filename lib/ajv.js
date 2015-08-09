'use strict';

var compileSchema = require('./compile')
    , resolve = require('./compile/resolve')
    , Cache = require('./cache')
    , stableStringify = require('json-stable-stringify')
    , formats = require('./compile/formats')
    , util = require('./compile/util');

module.exports = Ajv;

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

    // this is done on purpose, so that methods are bound to the instance
    // (without using bind) so that they can be used without the instance
    this.validate = validate;
    this.compile = compile;
    this.addSchema = addSchema;
    this.validateSchema = validateSchema;
    this.getSchema = getSchema;
    this.removeSchema = removeSchema;
    this.addFormat = addFormat;
    this.errorsText = errorsText;

    addInitialSchemas();
    addInitialFormats();


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
        } else v = _addSchema(schemaKeyRef);

        var valid = v(data);
        self.errors = v.errors;
        return valid;
    }


    /**
     * Create validator for passed schema.
     * @param  {String|Object} schema
     * @return {Object} validation result { valid: true/false, errors: [...] }
     */
    function compile(schema) {
        return _addSchema(schema);
    }


    /**
     * Adds schema to the instance.
     * @param {Object|Array} schema schema or array of schemas. If array is passed, `key` will be ignored.
     * @param {String} key Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
     */
    function addSchema(schema, key, _skipValidation) {
        if (Array.isArray(schema)) {
            schema.forEach(function(sch) { addSchema(sch); });
            return;
        }
        // can key/id have # inside?
        var key = resolve.normalizeId(key || schema.id);
        checkUnique(key);
        self._schemas[key] = _addSchema(schema, _skipValidation);
    }


    /**
     * Add schema that will be used to validate other schemas
     * removeAdditional option is alway set to false
     * @param {Object} schema
     * @param {String} key optional schema key
     */
    function addMetaSchema(schema, key, _skipValidation) {
        var currentRemoveAdditional = self.opts.removeAdditional;
        self.opts.removeAdditional = false;
        var validate = addSchema(schema, META_SCHEMA_ID, _skipValidation);
        self.opts.removeAdditional = currentRemoveAdditional;
    }


    /**
     * Validate schema
     * @param  {Object} schema schema to validate
     * @return {Boolean}
     */
    function validateSchema(schema) {
        var $schema = schema.$schema || META_SCHEMA_ID;
        var currentUriFormat = self._formats.uri;
        self._formats.uri = typeof currentUriFormat == 'function'
                            ? SCHEMA_URI_FORMAT_FUNC
                            : SCHEMA_URI_FORMAT;
        var valid = validate($schema, schema);
        self._formats.uri = currentUriFormat;
        return valid;
    }


    /**
     * Get compiled schema from the instance by `key` or `ref`.
     * @param  {String} keyRef `key` that was passed to `addSchema` or full schema reference (`schema.id` or resolved id).
     * @return {Function} schema validating function (with property `schema`).
     */
    function getSchema(keyRef) {
        keyRef = resolve.normalizeId(keyRef);
        return self._schemas[keyRef] || self._refs[keyRef];
    }


    /**
     * Remove cached schema
     * Even if schema is referenced by other schemas it still can be removed as other schemas have local references
     * @param  {String|Object} schemaKeyRef key, ref or schema object
     */
    function removeSchema(schemaKeyRef) {
        if (typeof schemaKeyRef == 'string') {
            schemaKeyRef = resolve.normalizeId(schemaKeyRef);
            var v = self._schemas[schemaKeyRef] || self._refs[schemaKeyRef];
            delete self._schemas[schemaKeyRef];
            delete self._refs[schemaKeyRef];
            var str = stableStringify(v.schema);
            self._cache.put(str);
        } else {
            var str = stableStringify(schemaKeyRef);
            self._cache.put(str);
        }
    }


    function _addSchema(schema, skipValidation) {
        if (typeof schema != 'object') throw new Error('schema should be object');
        var str = stableStringify(schema);
        var cached = self._cache.get(str);
        if (cached) return cached;

        var id = resolve.normalizeId(schema.id);
        if (id) checkUnique(id);

        var ok = skipValidation || self.opts.validateSchema === false
                 || validateSchema(schema);
        if (!ok) {
            var message = 'schema is invalid:' + errorsText();
            if (self.opts.validateSchema == 'log') console.error(message);
            else throw new Error(message);
        }

        var localRefs = resolve.ids.call(self, schema);

        var validate = compileSchema.call(self, schema, undefined, localRefs);
        if (id[0] != '#') self._refs[id] = validate;
        self._cache.put(str, validate);

        return validate;
    }


    function errorsText(errors, opts) {
        errors = errors || self.errors;
        if (!errors) return 'No errors';
        opts = opts || {};
        var separator = opts.separator || ', ';
        var dataVar = opts.dataVar || 'data';

        var text = errors.reduce(function(txt, e) {
            return e ? txt + e.keyword + ' ' + dataVar + e.dataPath + ': ' + e.message + separator : txt;
        }, '');
        return text.slice(0, -separator.length);
    }


    function addFormat(name, format) {
        if (typeof format == 'string') format = new RegExp(format);
        self._formats[name] = format;
    }


    function addInitialSchemas() {
        if (self.opts.meta !== false)
            addMetaSchema(require('./refs/json-schema-draft-04.json'), META_SCHEMA_ID, true);

        var optsSchemas = self.opts.schemas;
        if (!optsSchemas) return;
        if (Array.isArray(optsSchemas)) addSchema(optsSchemas);
        else for (var key in optsSchemas) addSchema(optsSchemas[key], key);
    }


    function addInitialFormats() {
        var optsFormats = self.opts.formats;
        if (!optsFormats) return;
        for (var name in optsFormats) {
            var format = optsFormats[name];
            addFormat(name, format);
        }
    }


    function checkUnique(id) {
        if (self._schemas[id] || self._refs[id])
            throw new Error('schema with key or id "' + id + '" already exists');
    }
}
