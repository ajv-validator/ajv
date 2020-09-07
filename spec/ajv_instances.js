"use strict"

const Ajv = require("./ajv")

module.exports = getAjvInstances

function getAjvInstances(options, extraOpts = {}) {
  return _getAjvInstances(options, {...extraOpts, logger: false, codegen: {lines: true}})
}

function _getAjvInstances(opts, useOpts) {
  const optNames = Object.keys(opts)
  if (optNames.length) {
    opts = Object.assign({}, opts)
    const useOpts1 = Object.assign({}, useOpts)
    const optName = optNames[0]
    useOpts1[optName] = opts[optName]
    delete opts[optName]
    const instances = _getAjvInstances(opts, useOpts),
      instances1 = _getAjvInstances(opts, useOpts1)
    return instances.concat(instances1)
  }
  return [new Ajv(useOpts)]
}
