'use strict';

var compileSchema = require('../lib/compile');
var mockInstance = { opts: {} };

describe('Schema compilation', function() {
    it.skip('works', function() {
        var compiled = compileSchema.call(mockInstance, { type: 'string' });
        console.log(compiled.validate.toString());
    });
});
