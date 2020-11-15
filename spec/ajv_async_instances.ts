import getAjvInstances from "./ajv_instances"
import _Ajv from "./ajv"
import type Ajv from "../dist/core"
import type {Options} from ".."

export default function getAjvSyncInstances(extraOpts?: Options): Ajv[] {
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

module.exports = getAjvSyncInstances
