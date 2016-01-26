'use strict';

var fs = require('fs')
  , doT = require('dot');

module.exports = {
  range:           doT.compile(fs.readFileSync(__dirname + '/range.jst', 'utf8')),
  rangeWithErrors: doT.compile(fs.readFileSync(__dirname + '/range_with_errors.jst', 'utf8'))
};
