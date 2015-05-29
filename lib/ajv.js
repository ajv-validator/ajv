'use strict';

var compileSchema = require('./compile')
    , stableStringify = require('json-stable-stringify')

module.exports = Ajv;

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
    this._byJson = {};

    // this is done on purpose, so that methods are bound to the instance
    // (without using bind) so that they can be used without the instance
    this.validate = validate;
    this.compile = compile;
    this.addSchema = addSchema;
    this.getSchema = getSchema;


    /**
     * Validate data using schema
     * Schema will be compiled and cached (using serialized JSON as key. [json-stable-stringify](https://github.com/substack/json-stable-stringify) is used to serialize.
     * @param  {String|Object} schema
     * @param  {Any} data to be validated
     * @return {Boolean} validation result. Errors from the last validation will be available in `jv.errors` (and also in compiled schema: `schema.errors`).
     */
    function validate(schema, data) {
        var compiled = _addSchema(schema);
        return compiled.validate(data, self);
    }


    /**
     * Create validator for passed schema.
     * @param  {String|Object} schema
     * @return {Object} validation result { valid: true/false, errors: [...] }
     */
    function compile(schema) {
        var compiled = _addSchema(schema);        
        return function validate(data) {
            return compiled.validate(data, self);
        };
    }


    /**
     * Adds schema to the instance.
     * @param {String|Object|Array} schema schema or array of schemas. If array is passed, `name` will be ignored.
     * @param {String} id Optional schema id. Will be used in addition to `schema.id` to find schema by `$ref`.
     * @return {Object} compiled schema with method `validate` that accepts `data`.
     */
    function addSchema(schema, id) {
        if (Array.isArray(schema)) return schema.map(addSchema);
        if (!id && !schema.id) throw new Error('no schema id');
        if (self._schemas[id] || self._schemas[schema.id])
            throw new Error('schema already exists');
        var compiled = _addSchema(schema);
        self._schemas[id] = compiled;
        self._schemas[schema.id] = compiled;
        return compiled;
    }


    /**
     * Get schema from the instance by by `id`
     * @param  {String} id `schema.id` or `id` that was passed to `addSchema` (schema will be availbale by its internal id even if the id was passed).
     * @return {Object} compiled schema with property `schema` and method `validate`.
     */
    function getSchema(id) {
        return self._schemas[id];
    }


    function _addSchema(schema) {
        if (typeof schema == 'string') schema = JSON.parse(schema);
        if (typeof schema != 'object') throw new Error('schema has invalid type');
        // var str = stableStringify(schema);
        // return (self._byJson[str] = self._byJson[str] || compileSchema.call(self, schema));
        return compileSchema.call(self, schema));
    }
}


function copy(o, to) {
    to = to || {};
    for (var key in o) to[key] = o[key];
    return to;
}
