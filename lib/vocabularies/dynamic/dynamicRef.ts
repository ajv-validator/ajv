import type {AnySchema, CodeKeywordDefinition} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import {_, getProperty, Code, Name} from "../../compile/codegen"
import N from "../../compile/names"
import {SchemaEnv, resolveRef} from "../../compile"
import MissingRefError from "../../compile/ref_error"
import {callRef, getValidate, inlineRefSchema} from "../core/ref"

const def: CodeKeywordDefinition = {
  keyword: "$dynamicRef",
  schemaType: "string",
  code: (cxt) => dynamicRef(cxt, cxt.schema),
}

interface DynamicTarget {
  validate?: Code
  sch?: SchemaEnv
  inlineSchema?: AnySchema
}

// Resolve the static target of a $dynamicRef the same way $ref does.
// Pure query — no codegen side effects. Caller handles inlining.
// Throws if the ref is unresolvable. Skips resolution for meta-schemas.
function resolveDynamicTarget(cxt: KeywordCxt, ref: string, anchor: string): DynamicTarget {
  const {gen, it} = cxt
  const {baseId, schemaEnv: env, self, validateName} = it
  const {root} = env

  if (env.meta || root.meta) return {validate: validateName}

  if (ref === "#" || ref === "#/") {
    if (baseId === root.baseId) {
      return {
        validate: env === root ? validateName : _`${gen.scopeValue("root", {ref: root})}.validate`,
        sch: root,
      }
    }
    return {validate: validateName, sch: env}
  }

  const schOrEnv = resolveRef.call(self, root, baseId, ref)
  if (schOrEnv instanceof SchemaEnv) {
    return {validate: getValidate(cxt, schOrEnv), sch: schOrEnv}
  }
  if (schOrEnv !== undefined) {
    return {inlineSchema: schOrEnv}
  }
  if (!root.dynamicAnchors[baseId]?.[anchor]) {
    throw new MissingRefError(it.opts.uriResolver, baseId, ref)
  }
  return {validate: validateName}
}

export function dynamicRef(cxt: KeywordCxt, ref: string): void {
  const {gen, it} = cxt
  const {baseId, schemaEnv: env} = it
  const {root} = env
  const frag = ref.slice(ref.indexOf("#") + 1)
  const anchor = frag === "/" ? "" : frag

  const resolved = resolveDynamicTarget(cxt, ref, anchor)
  if (resolved.inlineSchema !== undefined) {
    inlineRefSchema(cxt, resolved.inlineSchema, ref)
    return
  }
  if (resolved.validate === undefined) return

  const {validate} = resolved
  const isDynamic = resolved.sch
    ? hasDynamicAnchor(resolved.sch.schema, anchor)
    : root.dynamicAnchors[baseId]?.[anchor] === true

  if (it.allErrors) {
    _dynamicRef()
  } else {
    const valid = gen.let("valid", false)
    _dynamicRef(valid)
    cxt.ok(valid)
  }

  function _dynamicRef(valid?: Name): void {
    if (isDynamic) {
      const v = gen.let("_v", _`${N.dynamicAnchors}${getProperty(anchor)}`)
      gen.if(v, _callRef(v, valid), _callRef(validate, valid))
    } else {
      _callRef(validate, valid)()
    }
  }

  function _callRef(v: Code, valid?: Name): () => void {
    return valid
      ? () =>
          gen.block(() => {
            callRef(cxt, v)
            gen.let(valid, true)
          })
      : () => callRef(cxt, v)
  }
}

function hasDynamicAnchor(schema: AnySchema, anchor: string): boolean {
  if (typeof schema != "object") return false
  if (anchor) return schema.$dynamicAnchor === anchor
  return schema.$recursiveAnchor === true
}

export default def
