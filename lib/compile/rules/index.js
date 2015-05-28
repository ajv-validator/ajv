'use strict';

var fs = require('fs')
    , doT = require('dot');

var RULES = module.exports = {
    type:  { code: fs.readFileSync(__dirname + '/type.dot.js') },
    // enum:  { code: '' },
    allOf: { code: fs.readFileSync(__dirname + '/allOf.dot.js') },
    // anyOf: { code: '' },
    // oneOf: { code: '' },
    not:   { code: fs.readFileSync(__dirname + '/not.dot.js') },
    maximum: {
        code: fs.readFileSync(__dirname + '/maximum.dot.js'),
        type: 'number'
    },
    minimum: {
        code: fs.readFileSync(__dirname + '/minimum.dot.js'),
        type: 'number'
    },
    // multipleOf: {
    //     code: '',
    //     type: 'number'
    // },
    // maxLength: {
    //     code: '',
    //     type: 'string'
    // },
    // minLength: {
    //     code: '',
    //     type: 'string'
    // },
    // pattern: {
    //     code: '',
    //     type: 'string'
    // },
    // additionalItems: {
    //     code: '',
    //     type: 'array'
    // },
    // items: {
    //     code: '',
    //     type: 'array'
    // },
    // maxItems: {
    //     code: '',
    //     type: 'array'
    // },
    // minItems: {
    //     code: '',
    //     type: 'array'
    // },
    // uniqueItems: {
    //     code: '',
    //     type: 'array'
    // },
    // maxProperties: {
    //     code: '',
    //     type: 'object'
    // },
    // minProperties: {
    //     code: '',
    //     type: 'object'
    // },
    required: {
        code: fs.readFileSync(__dirname + '/required.dot.js'),
        type: 'object'
    },
    // additionalProperties: {
    //     code: '',
    //     type: 'object'
    // },
    properties: {
        code: fs.readFileSync(__dirname + '/properties.dot.js'),
        type: 'object'
    },
    // patternProperties: {
    //     code: '',
    //     type: 'object'
    // },
    // dependencies: {
    //     code: '',
    //     type: 'object'
    // }
};


for (var r in RULES) RULES[r].code = doT.compile(RULES[r].code);

// console.log(RULES.properties.code.toString());
