'use strict';

var g = typeof global == 'object' ? global :
        typeof window == 'object' ? window : this;

if (!g.Promise) {
  g.Promise = require('' + 'bluebird');
  g.Promise.config({ warnings: false });
}

module.exports = g.Promise;
