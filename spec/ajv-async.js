'use strict';

module.exports = typeof window == 'object' ? window.ajvAsync : require('' + 'ajv-async');
