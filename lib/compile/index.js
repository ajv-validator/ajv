'use strict';

var doT = require('dot')
    , fs = require('fs')
    , stableStringify = require('json-stable-stringify')
    , formats = require('./formats');

var RULES = require('./rules')
    , _validateTemplateStr = fs.readFileSync(__dirname + '/_validate.dot.js')
    , _validateTemplate = doT.compile(_validateTemplateStr)
    , validateTemplateStr = fs.readFileSync(__dirname + '/validate.dot.js')
    , validateTemplate = doT.compile(validateTemplateStr);

module.exports = compile;


function compile(schema) {
    var validateCode = validateTemplate({
        schema: schema,
        schemaPath: '',
        RULES: RULES,
        _validate: _validateTemplate,
        copy: copy,
        getDataType: getDataType,
        escapeQuotes: escapeQuotes,
        stableStringify: stableStringify,
        opts: this.opts
    });
    // console.log('\n\n\n *** \n', validateCode);
    var validate;
    eval(validateCode);

    return {
        validate: validate,
        schema: schema,
    };
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
