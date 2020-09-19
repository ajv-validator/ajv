import getAjvInstances from "./ajv_instances"
import type Ajv from ".."
import type {Options} from ".."

export default function getAjvSyncInstances(extraOpts?: Options): Ajv[] {
  return getAjvInstances(
    {
      strict: false,
      allErrors: true,
      codegen: {lines: true},
    },
    extraOpts
  )
}

module.exports = getAjvSyncInstances
