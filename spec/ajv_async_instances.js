"use strict"

const getAjvInstances = require("./ajv_instances")

module.exports = getAjvSyncInstances

function getAjvSyncInstances(extraOpts) {
  return getAjvInstances(
    {
      strict: false,
      allErrors: true,
      codegen: {lines: true},
    },
    extraOpts
  )
}
