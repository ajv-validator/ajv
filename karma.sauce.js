'use strict';

var fs = require('fs');

module.exports = function(config) {

  // Use ENV vars on Travis and sauce.json locally to get credentials
  if (!process.env.SAUCE_USERNAME) {
    if (!fs.existsSync('sauce.json')) {
      console.log('Create a sauce.json with your credentials based on the sauce-sample.json file.');
      process.exit(1);
    } else {
      process.env.SAUCE_USERNAME = require('./sauce').username;
      process.env.SAUCE_ACCESS_KEY = require('./sauce').accessKey;
    }
  }

  // Browsers to run on Sauce Labs
  var customLaunchers = {
    'SL_Chrome_27': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: '27'
    },
    'SL_Chrome_43': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: '43'
    },
    'SL_Chrome_beta': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: 'beta'
    },
    'SL_InternetExplorer_9': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '9'
    },
    'SL_InternetExplorer_10': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '10'
    },
    'SL_InternetExplorer_11': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '11'
    },
    'SL_FireFox_4': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '4'
    },
    'SL_FireFox_17': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '17'
    },
    'SL_FireFox_24': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '24'
    },
    'SL_FireFox': {
      base: 'SauceLabs',
      browserName: 'firefox'
    },
    'SL_Safari_5': {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '5'
    },
    'SL_Safari_6': {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '6'
    },
    'SL_Safari_7': {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '7'
    },
    'SL_iPhone_8': {
      base: 'SauceLabs',
      browserName: 'iphone',
      version: '8.1'
    }
  };


  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files: [
      '.browser/ajv.beautify.js',
      '.browser/*.spec.js'
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'saucelabs'],


    // web server port
    port: 9876,

    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    sauceLabs: {
      testName: 'Ajv'
    },
    captureTimeout: 600000,
    browserNoActivityTimeout: 240000,

    customLaunchers: customLaunchers,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(customLaunchers),
    singleRun: true
  });
};
