'use strict';

var compileSchema = require('../lib/compile');
var mockInstance = { opts: {} };
var assert = require('assert');

describe('Schema compilation', function() {
    it('works', function() {
        var validate = compileSchema.call(mockInstance, { type: 'string' });
        assert.equal(typeof validate, 'function');
    });
});
