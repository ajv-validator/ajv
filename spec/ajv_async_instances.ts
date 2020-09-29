import getAjvInstances from "./ajv_instances"
import type Ajv from ".."
import type {Options} from ".."

export default function getAjvSyncInstances(extraOpts?: Options): Ajv[] {
  return getAjvInstances(
    {
      strict: false,
      allErrors: true,
      code: {lines: true, optimize: false},
    },
    extraOpts
  )
}

module.exports = getAjvSyncInstances
