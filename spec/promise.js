'use strict';

var Promise = require('bluebird');

Promise.config({ warnings: false });

var g = typeof global == 'object' ? global :
        typeof window == 'object' ? window : this;

g.Promise = g.Promise || Promise;

module.exports = Promise;
