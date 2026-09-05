import type {CodeKeywordDefinition} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import {_, getProperty, Code, Name} from "../../compile/codegen"
import N from "../../compile/names"
import {callRef, getValidate} from "../core/ref"
import {resolveRef, SchemaEnv} from "../../compile"
import MissingRefError from "../../compile/ref_error"
import {isOwnProperty} from "../code"

const def: CodeKeywordDefinition = {
  keyword: "$dynamicRef",
  schemaType: "string",
  code: (cxt) => dynamicRef(cxt, cxt.schema),
}

export function dynamicRef(cxt: KeywordCxt, ref: string): void {
  if (cxt.it.opts.fullDynamicRefs) return fullDynamicRef(cxt, ref)
  const {gen, keyword, it} = cxt
  if (ref[0] !== "#") throw new Error(`"${keyword}" only supports hash fragment reference`)
  const anchor = ref.slice(1)
  if (it.allErrors) {
    _dynamicRef()
  } else {
    const valid = gen.let("valid", false)
    _dynamicRef(valid)
    cxt.ok(valid)
  }

  function _dynamicRef(valid?: Name): void {
    // TODO the assumption here is that `recursiveRef: #` always points to the root
    // of the schema object, which is not correct, because there may be $id that
    // makes # point to it, and the target schema may not contain dynamic/recursiveAnchor.
    // Because of that 2 tests in recursiveRef.json fail.
    // This is a similar problem to #815 (`$id` doesn't alter resolution scope for `{ "$ref": "#" }`).
    // (This problem is not tested in JSON-Schema-Test-Suite)
    if (it.schemaEnv.root.dynamicAnchors[anchor]) {
      const v = gen.let("_v", _`${N.dynamicAnchors}${getProperty(anchor)}`)
      gen.if(v, _callRef(v, valid), _callRef(it.validateName, valid))
    } else {
      _callRef(it.validateName, valid)()
    }
  }

  function _callRef(validate: Code, valid?: Name): () => void {
    return valid
      ? () =>
          gen.block(() => {
            callRef(cxt, validate)
            gen.let(valid, true)
          })
      : () => callRef(cxt, validate)
  }
}

function fullDynamicRef(cxt: KeywordCxt, ref: string): void {
  const {it, gen, keyword} = cxt
  const target = resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref, true)
  if (!(target instanceof SchemaEnv)) throw new MissingRefError(it.opts.uriResolver, it.baseId, ref)
  if (target.$async) {
    throw new Error("async dynamic references are not supported")
  }
  const validate = getValidate(gen, target)
  const {schema} = target
  const {fragment} = it.opts.uriResolver.parse(ref)
  let anchor: string | undefined
  if (typeof schema === "object") {
    if (keyword === "$recursiveRef") {
      if (schema.$recursiveAnchor === true) anchor = ""
    } else if (fragment !== undefined && fragment === schema.$dynamicAnchor) {
      anchor = fragment
    }
  }
  if (anchor === undefined) return callRef(cxt, validate, target)
  const scope = it.dynamicScope || N.dynamicAnchors
  const selected = gen.let(
    "dynamicRef",
    _`${isOwnProperty(gen, scope, anchor)} && ${scope}${getProperty(anchor)} || ${validate}`
  )
  callRef(cxt, selected)
}

export default def
