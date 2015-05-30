'use strict';

var doT = require('dot')
    , fs = require('fs')
    , stableStringify = require('json-stable-stringify')
    , formats = require('./formats')
    , resolve = require('./resolve');

var RULES = require('./rules')
    , _validateTemplateStr = fs.readFileSync(__dirname + '/_validate.dot.js')
    , _validateTemplate = doT.compile(_validateTemplateStr)
    , validateTemplateStr = fs.readFileSync(__dirname + '/validate.dot.js')
    , validateTemplate = doT.compile(validateTemplateStr);

module.exports = compile;


function compile(schema) {
    var self = this;
    var validateCode = validateTemplate({
        schema: schema,
        schemaPath: '',
        RULES: RULES,
        _validate: _validateTemplate,
        copy: copy,
        resolveRef: resolveRef,
        getDataType: getDataType,
        escapeQuotes: escapeQuotes,
        stableStringify: stableStringify,
        opts: this.opts
    });
    // console.log('\n\n\n *** \n', validateCode);
    var validate;
    eval(validateCode);

    var compiled = {
        validate: validate,
        schema: schema,
    };

    return compiled;

    function resolveRef(ref) {
        return resolve.call(self, compile, schema, ref);
    }

    function validateRef(ref, data) {
        return ref == '#'
                ? compiled.validate(data)
                : self._schemas[ref].validate(data);
    }
}


/**
 * Functions below are used inside compiled validations function
 */


function getDataType(data) {
    if (data === null) return 'null';
    if (Array.isArray(data)) return 'array';
    return typeof data;
}


function copy(o, to) {
    to = to || {};
    for (var key in o) to[key] = o[key];
    return to;
}


function escapeQuotes(str) {
    return str.replace(/"/g, '\\"');
}
