import getAjvInstances from "./ajv_instances"
import _Ajv from "./ajv"
import type AjvCore from "../dist/core"
import type {Options} from ".."

export default function getAjvSyncInstances(extraOpts?: Options): AjvCore[] {
  return getAjvInstances(
    _Ajv,
    {
      strict: false,
      allErrors: true,
      code: {lines: true, optimize: false},
    },
    extraOpts
  )
}
