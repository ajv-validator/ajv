'use strict';

var Logger = require('../lib/compile/logger')
  , should = require('./chai').should();

describe('logger object tests', function() {

  var logger;

  var origConsoleWarn = console.warn;
  var origConsoleLog = console.log;
  var origConsoleError = console.error;

  var consoleWarnCalled = false;
  var consoleLogCalled = false;
  var consoleErrorCalled = false;

  beforeEach(function() {
    console.warn = function() {
      consoleWarnCalled = true;
      origConsoleWarn.apply(console, arguments);
    };
    console.log = function() {
      consoleLogCalled = true;
      origConsoleLog.apply(console, arguments);
    };
    console.error = function() {
      consoleErrorCalled = true;
      origConsoleError.apply(console, arguments);
      return 'boo';
    };
  });

  afterEach(function() {
    console.warn = origConsoleWarn;
    console.log = origConsoleLog;
    console.error = origConsoleError;
    consoleErrorCalled = consoleLogCalled = consoleWarnCalled = false;
  });

  it('logger should log into global console by default', function() {

    logger = new Logger();

    logger.log('42');
    logger.warn('42');
    logger.error('42');

    should.equal(consoleWarnCalled, true);
    should.equal(consoleLogCalled, true);
    should.equal(consoleErrorCalled, true);
  });

  it('logger should log only into a custom logger if given', function() {
    var customWarnCalled = false;
    var customLogCalled = false;
    var customErrorCalled = false;

    var customLogger = {
      warn: function() {
        customWarnCalled = true;
      },
      log: function() {
        customLogCalled = true;
      },
      error: function() {
        customErrorCalled = true;
      }
    };

    logger = new Logger(customLogger);

    logger.log('42');
    logger.warn('42');
    logger.error('42');

    should.equal(consoleWarnCalled, false);
    should.equal(consoleLogCalled, false);
    should.equal(consoleErrorCalled, false);

    should.equal(customWarnCalled, true);
    should.equal(customLogCalled, true);
    should.equal(customErrorCalled, true);
  });

  it('if a custom logger is given without basic logging functions implementations it should not leads to an exception', function() {
    logger = new Logger({});

    logger.log('42');
    logger.warn('42');
    logger.error('42');

    should.equal(consoleWarnCalled, false);
    should.equal(consoleLogCalled, false);
    should.equal(consoleErrorCalled, false);
  });

  it('if a custom logger is set to null logging should be disabled', function() {
    logger = new Logger(null);

    logger.log('42');
    logger.warn('42');
    logger.error('42');

    should.equal(consoleWarnCalled, false);
    should.equal(consoleLogCalled, false);
    should.equal(consoleErrorCalled, false);
  });

});