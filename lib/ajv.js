'use strict';

var compileSchema = require('./compile')
    , resolve = require('./compile/resolve')
    , stableStringify = require('json-stable-stringify')

module.exports = Ajv;

var META_SCHEMA_ID = 'http://json-schema.org/draft-04/schema';

/**
 * Creates validator instance.
 * Usage: `jv(opts)`
 * @param {Object} opts optional options
 * @return {Object} jv instance
 */
function Ajv(opts) {
    if (!(this instanceof Ajv)) return new Ajv(opts);
    var self = this;

    this.opts = opts || {};
    this._schemas = {};
    this._refs = {};
    this._missing = {};
    this._byJson = {};

    // this is done on purpose, so that methods are bound to the instance
    // (without using bind) so that they can be used without the instance
    this.validate = validate;
    this.compile = compile;
    this.addSchema = addSchema;
    this.getSchema = getSchema;

    if (this.opts.meta !== false)
        addSchema(require('./refs/json-schema-draft-04.json'), META_SCHEMA_ID, true);

    /**
     * Validate data using schema
     * Schema will be compiled and cached (using serialized JSON as key. [json-stable-stringify](https://github.com/substack/json-stable-stringify) is used to serialize.
     * @param  {String|Object} schemaKeyRef key, ref or schema object
     * @param  {Any} data to be validated
     * @return {Boolean} validation result. Errors from the last validation will be available in `jv.errors` (and also in compiled schema: `schema.errors`).
     */
    function validate(schemaKeyRef, data) {
        if (typeof schemaKeyRef == 'string') {
            var v = getSchema(schemaKeyRef);
            if (!v) {
                v = getRef(schemaKeyRef);
                if (!v) throw new Error('no schema with key or ref "' + schemaKeyRef + '"');
            }
        } else v = _addSchema(schemaKeyRef);

        return v(data);
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
     * @return {Function} compiled schema with method `validate` that accepts `data`.
     */
    function addSchema(schema, key, _skipValidation) {
        if (Array.isArray(schema))
            return schema.map(function(sch) { return addSchema(sch); });
        // can key/id have # inside?
        var key = resolve.normalizeId(key || schema.id);
        checkUnique(key);
        var validate = self._schemas[key] = _addSchema(schema, _skipValidation);
        return validate;
    }


    function validateSchema(schema) {
        var $schema = schema.$schema || META_SCHEMA_ID;
        return validate($schema, schema);
    }


    /**
     * Get compiled schema from the instance by `key`.
     * @param  {String} key `key` that was passed to `addSchema` (or `schema.id`).
     * @return {Function} schema validating function (with property `schema`).
     */
    function getSchema(key) {
        key = resolve.normalizeId(key);
        return self._schemas[key];
    }


    /**
     * Get compiled schema from the instance by `id`.
     * @param  {String} id `schema.id` or any reference in any of previously passed schemas.
     * @return {Function} schema validating function (with property `schema`).
     */
    function getRef(ref) {
        ref = resolve.normalizeId(ref);
        // TODO
        return self._refs[ref];
    }


    function _addSchema(schema, skipValidation) {
        if (typeof schema != 'object') throw new Error('schema should be object');
        var str = stableStringify(schema);
        if (self._byJson[str]) return self._byJson[str];

        var id = resolve.normalizeId(schema.id);
        if (id) checkUnique(id);

        // var ok = skipValidation || self.opts.validateSchema === false
        //          || validateSchema(schema);
        // if (!ok) throw new Error('schema is invalid');

        resolve.ids.call(self, schema);

        var validate = self._refs[id] = self._byJson[str] = compileSchema.call(self, schema);

        return validate;
    }


    function checkUnique(id) {
        var schemaRef = self._refs[id];
        if (self._schemas[id] || (schemaRef && !schemaRef.missing))
            throw new Error('schema with key or id "' + id + '" already exists');
    }
}


function copy(o, to) {
    to = to || {};
    for (var key in o) to[key] = o[key];
    return to;
}
