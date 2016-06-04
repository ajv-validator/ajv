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
    { async: 'co*', allErrors: true },
    { async: 'es7', allErrors: true },
    { async: 'es7', transpile: 'nodent', allErrors: true }
  ];

  var ua;
  try { ua = window.navigator.userAgent.toLowerCase(); } catch(e) {}

  // regenerator does not work in IE9
  if (!(ua && /msie\s9/.test(ua))) {
    options = options.concat([
      { async: '*', transpile: 'regenerator' },
      { async: '*', transpile: 'regenerator', allErrors: true }
    ]);
  }

  if (fullTest) {
    options = options.concat([
      { async: '*' },
      { allErrors: true },
      { async: true, allErrors: true },
      { async: '*', allErrors: true }
    ]);

    if (!(ua && /msie\s9/.test(ua))) {
      options = options.concat([
        { async: 'co*', transpile: 'regenerator' },
        { async: 'co*', transpile: 'regenerator', allErrors: true }
      ]);
    }

    // es7 functions transpiled with regenerator are excluded from test in Safari/Firefox/Edge/IE9.
    // They fail in IE9 and emit multiple 'uncaught exception' warnings in Safari/Firefox/Edge anc cause remote tests to disconnect.
    if (!(ua && ((/safari/.test(ua) && !/chrome|phantomjs/.test(ua)) || /firefox|edge|msie\s9/.test(ua)))) {
      options = options.concat([
        { transpile: 'regenerator' },
        { async: true, transpile: 'regenerator' },
        { async: 'es7', transpile: 'regenerator' },
        { transpile: 'regenerator', allErrors: true },
        { async: true, transpile: 'regenerator', allErrors: true },
        { async: 'es7', transpile: 'regenerator', allErrors: true }
      ]);
    }
  }

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
  try { return new Ajv(opts); } catch(e) {}
}
