'use strict';

var doT = require('dot')
    , fs = require('fs')
    , stableStringify = require('json-stable-stringify')
    , formats = require('./formats')
    , resolve = require('./resolve');

var RULES = require('./rules')
    , validateTemplateStr = fs.readFileSync(__dirname + '/validate.dot.js')
    , validateTemplate = doT.compile(validateTemplateStr);

module.exports = compile;


function compile(schema) {
    var self = this;
    var validateCode = validateTemplate({
        schema: schema,
        schemaPath: '',
        RULES: RULES,
        validate: validateTemplate,
        copy: copy,
        resolveRef: resolveRef,
        getDataType: getDataType,
        escapeQuotes: escapeQuotes,
        stableStringify: stableStringify,
        opts: this.opts
    });
    // console.log('\n\n\n *** \n', validateCode);
    var validate;
    eval('validate = ' + validateCode);

    validate.schema = schema;

    return validate;

    function resolveRef(ref) {
        return resolve.call(self, compile, schema, ref);
    }

    function validateRef(ref, data) {
        return ref == '#'
                ? validate(data)
                : self._schemas[ref](data);
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
