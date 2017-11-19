'use strict';

module.exports = Logger;

/**
 * @constructor
 * @this Logger
 * @param {*=} loggerObj logger object, expected to implement log, warn and error, if not given global console will be taken.
 */
function Logger(loggerObj) {
  if(loggerObj && typeof loggerObj === 'object')
    this.logger = loggerObj;
  else if(typeof loggerObj === 'undefined')
    this.logger = typeof console === 'object' ? console : {log: noop, warn: noop, error: noop};
  else
    this.logger = null;
}

Logger.prototype.log = function() {
  _logFunc.call(this, 'log', arguments);
};

Logger.prototype.warn = function() {
  _logFunc.call(this, 'warn', arguments);
};

Logger.prototype.error = function() {
  _logFunc.call(this, 'error', arguments);
};

/**
 * @this Logger
 * @param {String} level log level - log, warn or error
 * @param {Array} args log argumets
 * @private
 */
function _logFunc(level, args) {
  if(this.logger && this.logger[level]) this.logger[level].apply(this, args);
}

function noop() {}