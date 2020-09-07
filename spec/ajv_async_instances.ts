import getAjvInstances from "./ajv_instances"
import type Ajv from "../dist/ajv"
import type {Options} from "../dist/types"

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
