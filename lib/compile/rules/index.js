'use strict';

var fs = require('fs')
    , doT = require('dot');

var RULES = module.exports = {
    type:  { code: fs.readFileSync(__dirname + '/type.dot.js') },
    enum:  { code: '' },
    allOf: { code: '' },
    anyOf: { code: '' },
    oneOf: { code: '' },
    not:   { code: '' },
    maximum: {
        code: '',
        type: 'number'
    },
    minimum: {
        code: '',
        type: 'number'
    },
    multipleOf: {
        code: '',
        type: 'number'
    },
    maxLength: {
        code: '',
        type: 'string'
    },
    minLength: {
        code: '',
        type: 'string'
    },
    pattern: {
        code: '',
        type: 'string'
    },
    additionalItems: {
        code: '',
        type: 'array'
    },
    items: {
        code: '',
        type: 'array'
    },
    maxItems: {
        code: '',
        type: 'array'
    },
    minItems: {
        code: '',
        type: 'array'
    },
    uniqueItems: {
        code: '',
        type: 'array'
    },
    maxProperties: {
        code: '',
        type: 'object'
    },
    minProperties: {
        code: '',
        type: 'object'
    },
    required: {
        code: '',
        type: 'object'
    },
    additionalProperties: {
        code: '',
        type: 'object'
    },
    properties: {
        code: '',
        type: 'object'
    },
    patternProperties: {
        code: '',
        type: 'object'
    },
    dependencies: {
        code: '',
        type: 'object'
    }
};


for (var r in RULES) RULES[r].code = doT.compile(RULES[r].code);
