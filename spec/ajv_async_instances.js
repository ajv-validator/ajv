'use strict';

var Ajv = require('./ajv')
  , util = require('../lib/compile/util')
  , setupAsync = require('./ajv-async');

module.exports = getAjvInstances;

var firstTime = true;


function getAjvInstances(opts) {
  opts = opts || {};
  var instances = [];
  var options = [
    {},
    { transpile: true },
    { allErrors: true },
    { transpile: true, allErrors: true }
  ];

  options.forEach(function (_opts) {
    util.copy(opts, _opts);
    var ajv = getAjv(_opts);
    if (ajv) instances.push(ajv);
  });

  if (firstTime) {
    console.log('Testing', instances.length, 'ajv instances:');
    firstTime = false;
  }

  return instances;
}


function getAjv(opts){
  try { return setupAsync(new Ajv(opts)); } catch(e) {}
}
