'use strict';

var Ajv = require(typeof window == 'object' ? 'ajv' : '../lib/ajv')
  , util = require('../lib/compile/util');

module.exports = getAjvInstances;


function getAjvInstances(options, extraOpts) {
  return _getAjvInstances(options, extraOpts || {});
}

function _getAjvInstances(opts, useOpts) {
  var optNames = Object.keys(opts);
  if (optNames.length) {
    opts = util.copy(opts);
    var useOpts1 = util.copy(useOpts)
      , optName = optNames[0];
    useOpts1[optName] = opts[optName];
    delete opts[optName];
    var instances = _getAjvInstances(opts, useOpts)
      , instances1 = _getAjvInstances(opts, useOpts1);
    return instances.concat(instances1);
  } else return [ Ajv(useOpts) ];
}
