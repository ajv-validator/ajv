'use strict';

var compileSchema = require('../lib/compile');
var mockInstance = { opts: {} };

describe('Schema compilation', function() {
    it('works', function() {
        compileSchema.call(mockInstance, { type: 'string' });
    });
});
