'use strict';

module.exports = {
  setup: setupAsync
};


var util = require('./compile/util');

var ASYNC = {
  '*': checkGenerators,
  'co*': checkGenerators,
  'es7': checkAsyncFunction
};

var TRANSPILE = {
  'nodent': getNodent,
  'regenerator': getRegenerator
};

var MODES = [
  { async: 'es7' },
  { async: 'co*' },
  { async: 'es7', transpile: 'nodent' },
  { async: 'co*', transpile: 'regenerator' }
];


var regenerator, nodent;


function setupAsync(opts, required) {
  if (required !== false) required = true;
  var async = opts.async
    , transpile = opts.transpile
    , check;

  switch (typeof transpile) {
    case 'string':
      var get = TRANSPILE[transpile];
      if (!get) throw new Error('bad transpiler: ' + transpile);
      return (opts._transpileFunc = get(opts, required));
    case 'undefined':
    case 'boolean':
      if (typeof async == 'string') {
        check = ASYNC[async];
        if (!check) throw new Error('bad async mode: ' + async);
        return (opts.transpile = check(opts, required));
      }

      for (var i=0; i<MODES.length; i++) {
        var _opts = MODES[i];
        if (setupAsync(_opts, false)) {
          util.copy(_opts, opts);
          return opts.transpile;
        }
      }
      /* istanbul ignore next */
      throw new Error('generators, nodent and regenerator are not available');
    case 'function':
      return (opts._transpileFunc = opts.transpile);
    default:
      throw new Error('bad transpiler: ' + transpile);
  }
}


function checkGenerators(opts, required) {
  /* jshint evil: true */
  try {
    (new Function('(function*(){})()'))();
    return true;
  } catch(e) {
    /* istanbul ignore next */
    if (required) throw new Error('generators not supported');
  }
}


function checkAsyncFunction(opts, required) {
  /* jshint evil: true */
  try {
    (new Function('(async function(){})()'))();
    /* istanbul ignore next */
    return true;
  } catch(e) {
    if (required) throw new Error('es7 async functions not supported');
  }
}


function getRegenerator(opts, required) {
  try {
    if (!regenerator) {
      var name = 'regenerator';
      regenerator = require(name);
      regenerator.runtime();
    }
    if (!opts.async || opts.async === true)
      opts.async = 'es7';
    return regeneratorTranspile;
  } catch(e) {
    /* istanbul ignore next */
    if (required) throw new Error('regenerator not available');
  }
}


function regeneratorTranspile(code) {
  return regenerator.compile(code).code;
}


function getNodent(opts, required) {
  /* jshint evil: true */
  try {
    if (!nodent) {
      var name = 'nodent';
      nodent = require(name)({ log: false, dontInstallRequireHook: true });
    }
    if (opts.async != 'es7') {
      if (opts.async && opts.async !== true) console.warn('nodent transpiles only es7 async functions');
      opts.async = 'es7';
    }
    return nodentTranspile;
  } catch(e) {
    /* istanbul ignore next */
    if (required) throw new Error('nodent not available');
  }
}


function nodentTranspile(code) {
  return nodent.compile(code, '', { promises: true, sourcemap: false }).code;
}
