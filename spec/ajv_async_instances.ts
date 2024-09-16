import getAjvInstances from "./ajv_instances"
import {default as _Ajv, AjvJtdClass as _AjvJtd} from "./ajv"
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

export function getAjvJtdAsyncInstances(extraOpts?: Options): AjvCore[] {
  return getAjvInstances(
    _AjvJtd,
    {
      strict: false,
      allErrors: true,
      code: {lines: true, optimize: false},
    },
    extraOpts
  )
}
