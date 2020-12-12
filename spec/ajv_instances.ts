import type AjvCore from "../dist/core"
import type {Options} from ".."
import AjvPack from "../dist/standalone/instance"

export default function getAjvInstances(
  _Ajv: typeof AjvCore,
  options: Options,
  extraOpts: Options = {}
): AjvCore[] {
  return _getAjvInstances(options, {...extraOpts, logger: false})

  function _getAjvInstances(opts: Options, useOpts: Options): AjvCore[] {
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
}

export function withStandalone(instances: AjvCore[]): (AjvCore | AjvPack)[] {
  return (instances as (AjvCore | AjvPack)[]).concat(instances.map((ajv) => new AjvPack(ajv)))
}

export function getStandalone(_Ajv: typeof AjvCore, opts: Options = {}): AjvPack {
  opts.code ||= {}
  opts.code.source = true
  return new AjvPack(new _Ajv(opts))
}
