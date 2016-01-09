'use strict';

var isBrowser = typeof window == 'object';
var fullTest = isBrowser || !process.env.AJV_FAST_TEST;

var options = fullTest
              ? {
                  allErrors:    true,
                  verbose:      true,
                  format:       'full',
                  inlineRefs:   false,
                  jsonPointers: true
                }
              : { allErrors: true };

if (fullTest && !isBrowser) options.beautify = true;

module.exports = options;
