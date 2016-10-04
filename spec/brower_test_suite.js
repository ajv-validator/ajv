'use strict';

module.exports = function (suite) {
  suite.forEach(function (file) {
    file.test = file.module;
  });
  return suite;
};
