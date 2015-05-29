'use strict';

var fs = require('fs')
    , doT = require('dot');

var RULES = module.exports = {
    type:  { code: fs.readFileSync(__dirname + '/type.dot.js') },
    enum:  { code: fs.readFileSync(__dirname + '/enum.dot.js') },
    allOf: { code: fs.readFileSync(__dirname + '/allOf.dot.js') },
    anyOf: { code: fs.readFileSync(__dirname + '/anyOf.dot.js') },
    oneOf: { code: fs.readFileSync(__dirname + '/oneOf.dot.js') },
    not:   { code: fs.readFileSync(__dirname + '/not.dot.js') },
    maximum: { // includes exclusiveMaximum
        code: fs.readFileSync(__dirname + '/maximum.dot.js'),
        type: 'number'
    },
    minimum: { // includes exclusiveMinimum
        code: fs.readFileSync(__dirname + '/minimum.dot.js'),
        type: 'number'
    },
    multipleOf: {
        code: fs.readFileSync(__dirname + '/multipleOf.dot.js'),
        type: 'number'
    },
    maxLength: {
        code: fs.readFileSync(__dirname + '/maxLength.dot.js'),
        type: 'string'
    },
    minLength: {
        code: fs.readFileSync(__dirname + '/minLength.dot.js'),
        type: 'string'
    },
    pattern: {
        code: fs.readFileSync(__dirname + '/pattern.dot.js'),
        type: 'string'
    },
    format: {
        code: fs.readFileSync(__dirname + '/format.dot.js'),
        type: 'string'
    },
    items: { // includes additionalItems
        code: fs.readFileSync(__dirname + '/items.dot.js'),
        type: 'array'
    },
    maxItems: {
        code: fs.readFileSync(__dirname + '/maxItems.dot.js'),
        type: 'array'
    },
    minItems: {
        code: fs.readFileSync(__dirname + '/minItems.dot.js'),
        type: 'array'
    },
    uniqueItems: {
        code: fs.readFileSync(__dirname + '/uniqueItems.dot.js'),
        type: 'array'
    },
    maxProperties: {
        code: fs.readFileSync(__dirname + '/maxProperties.dot.js'),
        type: 'object'
    },
    minProperties: {
        code: fs.readFileSync(__dirname + '/minProperties.dot.js'),
        type: 'object'
    },
    required: {
        code: fs.readFileSync(__dirname + '/required.dot.js'),
        type: 'object'
    },
    properties: { // includes patternProperties and additionalProperties
        code: fs.readFileSync(__dirname + '/properties.dot.js'),
        type: 'object'
    },
    dependencies: {
        code: fs.readFileSync(__dirname + '/dependencies.dot.js'),
        type: 'object'
    }
};


for (var r in RULES) RULES[r].code = doT.compile(RULES[r].code);

// console.log(RULES.properties.code.toString());
