import type AjvCore from "../dist/core"
import type {Options} from ".."
import _Ajv from "./ajv"
import _Ajv2019 from "./ajv2019"
import getAjvInstances from "./ajv_instances"

export default function getAjvAllInstances(options: Options, extraOpts: Options = {}): AjvCore[] {
  return [...getAjvs(_Ajv), ...getAjvs(_Ajv2019)]

  function getAjvs(Ajv: typeof AjvCore): AjvCore[] {
    return getAjvInstances(Ajv, options, extraOpts)
  }
}
