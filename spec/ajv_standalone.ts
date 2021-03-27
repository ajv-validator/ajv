import type AjvCore from "../dist/core"
import type {Options} from ".."
import AjvPack from "../dist/standalone/instance"

export function withStandalone(instances: AjvCore[]): (AjvCore | AjvPack)[] {
  return [...(instances as (AjvCore | AjvPack)[]), ...instances.map(makeStandalone)]
}

function makeStandalone(ajv: AjvCore): AjvPack {
  ajv.opts.code.source = true
  return new AjvPack(ajv)
}

export function getStandalone(_Ajv: typeof AjvCore, opts: Options = {}): AjvPack {
  opts.code ||= {}
  opts.code.source = true
  return new AjvPack(new _Ajv(opts))
}
