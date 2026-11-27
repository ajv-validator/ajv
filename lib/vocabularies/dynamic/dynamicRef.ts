import type {AnySchema, CodeKeywordDefinition} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import {_, getProperty, Code} from "../../compile/codegen"
import N from "../../compile/names"
import MissingRefError from "../../compile/ref_error"
import {SchemaEnv, compileSchema, resolveRef} from "../../compile"
import {ANCHOR, normalizeId, resolveUrl} from "../../compile/resolve"
import {callRef, callStaticRef, getValidate} from "../core/ref"

const def: CodeKeywordDefinition = {
  keyword: "$dynamicRef",
  schemaType: "string",
  code: (cxt) => dynamicRef(cxt, cxt.schema),
}

export function dynamicRef(cxt: KeywordCxt, ref: string): void {
  const {gen, keyword, it} = cxt
  const {baseId, schemaEnv, opts, self} = it
  const {root} = schemaEnv

  if (keyword === "$recursiveRef") {
    if (ref[0] !== "#") throw new Error(`"${keyword}" only supports hash fragment reference`)
    const anchor = ref.slice(1)
    const isRootBase = normalizeId(baseId) === normalizeId(root.baseId)
    let targetEnv: SchemaEnv
    if (isRootBase) {
      targetEnv = root
    } else {
      const schOrEnv = resolveRef.call(self, root, baseId, ref)
      if (schOrEnv === undefined) throw new MissingRefError(opts.uriResolver, baseId, ref)
      targetEnv = ensureSchemaEnv(schOrEnv)
    }
    const targetValidate = getTargetValidate(targetEnv)
    const hasRecursiveAnchor =
      typeof targetEnv.schema == "object" && targetEnv.schema.$recursiveAnchor === true
    if (hasRecursiveAnchor) {
      const v = gen.const("_v", _`${N.dynamicAnchors}${getProperty(anchor)} || ${targetValidate}`)
      callRef(cxt, v, undefined, targetEnv.$async)
    } else {
      callRef(cxt, targetValidate, targetEnv, targetEnv.$async)
    }
    return
  }

  const resolvedRef = resolveUrl(opts.uriResolver, baseId, ref)
  const {fragment} = opts.uriResolver.parse(resolvedRef)
  if (typeof fragment == "string" && ANCHOR.test(fragment)) {
    const schOrEnv = resolveRef.call(self, root, baseId, ref)
    if (schOrEnv === undefined) throw new MissingRefError(opts.uriResolver, baseId, ref)
    const targetSchema = schOrEnv instanceof SchemaEnv ? schOrEnv.schema : schOrEnv
    if (typeof targetSchema == "object" && targetSchema.$dynamicAnchor === fragment) {
      const targetEnv = ensureSchemaEnv(schOrEnv)
      const targetValidate = getTargetValidate(targetEnv)
      const v = gen.const("_v", _`${N.dynamicAnchors}${getProperty(fragment)} || ${targetValidate}`)
      callRef(cxt, v, undefined, targetEnv.$async)
      return
    }
  }

  callStaticRef(cxt, ref)

  function ensureSchemaEnv(schOrEnv: AnySchema | SchemaEnv): SchemaEnv {
    if (schOrEnv instanceof SchemaEnv) return schOrEnv
    const {schemaId} = opts
    const sch = new SchemaEnv({
      schema: schOrEnv,
      schemaId,
      root,
      baseId: normalizeId(baseId),
      localRefs: root.localRefs,
      meta: root.meta,
    })
    compileSchema.call(self, sch)
    return sch
  }

  function getTargetValidate(targetEnv: SchemaEnv): Code {
    if (targetEnv === schemaEnv) return it.validateName
    if (targetEnv === root) {
      const rootName = gen.scopeValue("root", {ref: root})
      return _`${rootName}.validate`
    }
    return getValidate(cxt, targetEnv)
  }
}

export default def
