'use strict';

var logger;

_reset();

module.exports = {
  log: _logFunc('log'),
  warn: _logFunc('warn'),
  error: _logFunc('error'),
  set: _setLogger,
  reset: _reset
};

/**
 * @param {String} level log level - log, warn or error
 * @return {Function} log function
 * @private
 */
function _logFunc(level) {
  /**
   * @this Ajv
   */
  return function() {
    if(logger && logger[level]) logger[level].apply(this, arguments);
  };
}

/**
 * Set actual logger object, in order to disable the logger send non object or null
 * @param {*} loggerObj logger object, expected to implement log, warn and error, if not it gets noop implementation.
 */
function _setLogger(loggerObj) {
  if(loggerObj && typeof loggerObj === 'object')
    logger = loggerObj;
  else
    logger = null;
}

/**
 * Reset logger to global console
 */
function _reset() {
  logger = typeof console === 'object' ? console : {log: noop, warn: noop, error: noop};
}

function noop() {}