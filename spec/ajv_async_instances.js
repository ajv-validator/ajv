'use strict';

var Ajv = require('./ajv')
  , util = require('../lib/compile/util');

module.exports = getAjvInstances;


var firstTime = true;

var isBrowser = typeof window == 'object';
var fullTest = isBrowser || !process.env.AJV_FAST_TEST;


function getAjvInstances(opts) {
  opts = opts || {};
  var instances = [];
  var options = [
    {},
    { async: true },
    { async: 'co*' },
    { async: 'es7' },
    { async: 'es7', transpile: 'nodent' },
    { async: '*', transpile: 'regenerator' },
    { async: 'co*', allErrors: true },
    { async: 'es7', allErrors: true },
    { async: 'es7', transpile: 'nodent', allErrors: true },
    { async: '*', transpile: 'regenerator', allErrors: true },
  ];

  if (fullTest) options.concat([
    { async: '*' },
    { transpile: 'regenerator' },
    { async: true, transpile: 'regenerator' },
    { async: 'co*', transpile: 'regenerator' },
    { async: 'es7', transpile: 'regenerator' },
    { allErrors: true },
    { async: true, allErrors: true },
    { async: '*', allErrors: true },
    { transpile: 'regenerator', allErrors: true },
    { async: true, transpile: 'regenerator', allErrors: true },
    { async: 'co*', transpile: 'regenerator', allErrors: true },
    { async: 'es7', transpile: 'regenerator', allErrors: true }
  ]);

  // options = options.filter(function (_opts) {
  //   return _opts.transpile == 'nodent';
  // });

  // var i = 10, repeatOptions = [];
  // while (i--) repeatOptions = repeatOptions.concat(options);
  // options = repeatOptions;

  options.forEach(function (_opts) {
    util.copy(opts, _opts);
    var ajv = getAjv(_opts);
    if (ajv) instances.push(ajv);
  });


  if (firstTime) {
    var asyncModes = [];
    instances.forEach(function (ajv) {
      if (!ajv._opts.async) return;
      var t = ajv._opts.transpile;
      var mode = ajv._opts.async + (t === true ? '' : '.' + t);
      if (asyncModes.indexOf(mode) == -1) asyncModes.push(mode);
    });
    console.log('Testing', instances.length, 'ajv instances:', asyncModes.join(','));
    firstTime = false;
  }

  return instances;
}


function getAjv(opts){
  try { return Ajv(opts); } catch(e) {}
}
