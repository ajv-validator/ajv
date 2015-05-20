'use strict';

var doT = require('dot');

module.exports = compile;


function compileSchema(schema) {
    var self = this; // jv instance
    return {
        validate: function(data, opts) { return true; },
        schema: schema,
        errors: []
    };
}