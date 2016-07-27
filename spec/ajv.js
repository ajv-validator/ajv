'use strict';

module.exports = typeof window == 'object' ? window.Ajv : require('' + '../lib/ajv');
