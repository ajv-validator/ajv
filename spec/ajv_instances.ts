import _Ajv from "./ajv"
import type Ajv from "../dist/ajv"
import type {Options} from "../dist/types"

export default function getAjvInstances(options: Options, extraOpts: Options = {}): Ajv[] {
  return _getAjvInstances(options, {...extraOpts, logger: false, codegen: {lines: true}})
}

function _getAjvInstances(opts: Options, useOpts: Options): Ajv[] {
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
  return [new _Ajv(useOpts)]
}

module.exports = getAjvInstances
