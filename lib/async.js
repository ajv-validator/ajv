'use strict';

/**
 * Create validating function for passed schema with asynchronous loading of missing schemas.
 * `loadSchema` option should be a function that accepts schema uri and node-style callback.
 * @param  {String|Object} schema
 * @param  {Function} callback node-style callback, it is always called with 2 parameters: error (or null) and validating function.
 */
module.exports = {
  setTranspile: setTranspile,
  compile: compileAsync
};


var ASYNC = {
  'generators': generatorsSupported,
  'co.generators': generatorsSupported,
  'es7.nodent': getNodent,
  'es7.regenerator': getRegenerator,
  'regenerator': getRegenerator,
  'co.regenerator': getRegenerator
};
var MODES = ['co.generators', 'es7.nodent', 'es7.regenerator'];
var MODES_STR = MODES.join('/');
var regenerator, nodent;


function setTranspile(opts) {
  var mode = opts.async;
  var get = ASYNC[mode];
  var transpile;
  if (get) {
    transpile = opts.transpile = opts.transpile || get(opts);
    if (transpile) return;
  } else if (mode === true) {
    for (var i=0; i<MODES.length; i++) {
      mode = MODES[i];
      get = ASYNC[mode];
      transpile = get(opts);
      if (transpile) {
        opts.async = mode;
        opts.transpile = transpile;
        return;
      }
    }
    mode = MODES_STR;
  } else if (mode != 'es7')
    throw new Error('unknown async mode:', mode);

  throw new Error(mode + ' not available');
}


function generatorsSupported(opts) {
  /* jshint evil: true */
  try {
    eval('(function*(){})()');
    return true;
  } catch(e) {}
}


function getRegenerator() {
  try {
    if (!regenerator) {
      regenerator = require('' + 'regenerator');
      regenerator.runtime();
    }
    return regeneratorTranspile;
  } catch(e) {}
}


function regeneratorTranspile(code) {
  return regenerator.compile(code).code;
}


function getNodent() {
  /* jshint evil: true */
  try {
    // nodent declares functions not only on the top level, it won't work in node 0.10-0.12 in strict mode
    eval('(function () { "use strict"; if (true) { b(); function b() {} } })()');
    if (!nodent) nodent = require('' + 'nodent')({ log: noop, dontInstallRequireHook: true });
    return nodentTranspile;
  } catch(e) {}
}


function noop() {}


function nodentTranspile(code) {
  return nodent.compile(code, '', { promises: true, sourcemap: false }).code;
}


function compileAsync(schema, callback) {
  /* jshint validthis: true */
  var schemaObj;
  var self = this;
  try {
    schemaObj = this._addSchema(schema);
  } catch(e) {
    setTimeout(function() { callback(e); });
    return;
  }
  if (schemaObj.validate)
    setTimeout(function() { callback(null, schemaObj.validate); });
  else {
    if (typeof this._opts.loadSchema != 'function')
      throw new Error('options.loadSchema should be a function');
    _compileAsync(schema, callback, true);
  }


  function _compileAsync(schema, callback, firstCall) {
    var validate;
    try { validate = self.compile(schema); }
    catch(e) {
      if (e.missingSchema) loadMissingSchema(e);
      else deferCallback(e);
      return;
    }
    deferCallback(null, validate);

    function loadMissingSchema(e) {
      var ref = e.missingSchema;
      if (self._refs[ref] || self._schemas[ref])
        return callback(new Error('Schema ' + ref + ' is loaded but' + e.missingRef + 'cannot be resolved'));
      var _callbacks = self._loadingSchemas[ref];
      if (_callbacks) {
        if (typeof _callbacks == 'function')
          self._loadingSchemas[ref] = [_callbacks, schemaLoaded];
        else
          _callbacks[_callbacks.length] = schemaLoaded;
      } else {
        self._loadingSchemas[ref] = schemaLoaded;
        self._opts.loadSchema(ref, function (err, sch) {
          var _callbacks = self._loadingSchemas[ref];
          delete self._loadingSchemas[ref];
          if (typeof _callbacks == 'function')
            _callbacks(err, sch);
          else
            for (var i=0; i<_callbacks.length; i++)
              _callbacks[i](err, sch);
        });
      }

      function schemaLoaded(err, sch) {
        if (err) callback(err);
        else {
          if (!(self._refs[ref] || self._schemas[ref])) {
            try {
              self.addSchema(sch, ref);
            } catch(e) {
              callback(e);
              return;
            }
          }
          _compileAsync(schema, callback);
        }
      }
    }

    function deferCallback(err, validate) {
      if (firstCall) setTimeout(function() { callback(err, validate); });
      else callback(err, validate);
    }
  }
}
