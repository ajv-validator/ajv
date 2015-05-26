'use strict';

var doT = require('dot')
    , fs = require('fs');

var RULES = require('./rules')
    , validateTemplateStr = fs.readFileSync(__dirname + '/validate.dot.js')
    , validateTemplate = doT.compile(validateTemplateStr);

module.exports = compile;


function compile(schema) {
    var validateCode = validateTemplate.call(this, { schema: schema, RULES: RULES });
    // console.log('\n\n\n *** \n', validateCode);
    var validate;
    eval(validateCode);

    return {
        validate: validate,
        schema: schema,
    };
}
