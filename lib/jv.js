'use strict';

var compileSchema = require('./compile')
    , stableStringify = require('json-stable-stringify')

module.exports = Jv;

/**
 * Creates validator instance.
 * Usage: `jv(opts)`
 * @param {Object} opts optional options
 * @return {Object} jv instance
 */
function Jv(opts) {
    if (!(this instanceof Jv) return new Jv(opts);
    this._opts = opts || {};
    this._schemas = {};
    this._byJson = {};
}

Jv.prototype.addSchema = addSchema;
Jv.prototype.getSchema = getSchema;
Jv.prototype.validate = validate;
Jv.prototype.validator = validator;


/**
 * Adds schema to the instance.
 * @param {String|Object|Array} schema schema or array of schemas. If array is passed, `name` will be ignored.
 * @param {String} name Optional schema name. Will be used in addition to `schema.id` to find schema by `$ref`.
 * @return {Object} compiled schema with method `validate` that accepts parameters `data` and `opts`.
 */
function addSchema(schema, name) {
    if (Array.isArray(schema)) return schema.map(addSchema, this);
    name = name || schema.id;
    if (!name) throw new Error('no schema name');
    if (this._schemas[name] || this._schemas[schema.id])
        throw new Error('schema already exists');
    var compiled = _addSchema.call(this, schema);
    this._schemas[name] = compiled;
    if (name != schema.id) this._schemas[schema.id] = compiled;
    return compiled;
}


/**
 * Get schema from the instance by `name` or by `id`
 * @param  {String} name `schema.id` or schema `name` that was passed to `addSchema` (schema will be availbale by id even if the name was passed).
 * @return {Object} compiled schema with property `schema` and method `validate`.
 */
function getSchema(name) {
    return this._schemas[name];
}


function _addSchema(schema) {
    if (typeof schema == 'string') schema = JSON.parse(schema);
    if (typeof schema != 'object') throw new Error('schema has invalid type');
    var str = stableStringify(schema);
    return (this._byJson[str] = this._byJson[str] || compileSchema.call(this, schema));
}


/**
 * Validate data using schema
 * Schema will be compiled and cached (using serialized JSON as key. [json-stable-stringify](https://github.com/substack/json-stable-stringify) is used to serialize.
 * @param  {Any} data to be validated
 * @param  {String|Object} schema
 * @param  {Object} opts optional options that will extend the options passed to the instance.
 * @return {Boolean} validation result. Errors from the last validation will be available in `jv.errors` (and also in compiled schema: `schema.errors`).
 */
function validate(data, schema, opts) {
    var compiled = _addSchema.call(this, schema);
    var _opts = _getOpts.call(this, opts);
    return compiled.validate(data, _opts );
}


/**
 * Create validator function for passed schema and options.
 * @param  {String|Object} schema
 * @param  {[type]} opts Optional options
 * @return {[type]} validation result. Errors from the last validation will be available at `v.errors` where `v` is the created validator function.
 */
function validator(schema, opts) {
    var compiled = _addSchema.call(this, schema);
    var _opts = _getOpts.call(this, opts);
    var self = this;
    return function v(data) {
        var result = compiled.validate(data, _opts);
        v.errors = compiled.errors;
        return result;
    };
}


function _getOpts(opts) {
    return opts ? copy(opts, copy(this._opts)) : this._opts;
}


function copy(o, to) {
    to = to || {};
    for (var key in o) to[key] = o[key];
    return to;
}
