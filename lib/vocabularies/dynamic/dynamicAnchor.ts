import type {AnySchemaObject, CodeKeywordDefinition} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import type {SchemaObjCxt} from "../../compile"
import {_, or, getProperty, Code} from "../../compile/codegen"
import N from "../../compile/names"
import {SchemaEnv, compileSchema, resolveRef} from "../../compile"
import {normalizeId} from "../../compile/resolve"
import {getValidate} from "../core/ref"

const def: CodeKeywordDefinition = {
  keyword: "$dynamicAnchor",
  schemaType: "string",
  code: (cxt) => dynamicAnchor(cxt, cxt.schema),
}

export function getResourceDynamicAnchors(
  it: SchemaObjCxt
): {[Anchor in string]?: AnySchemaObject} | undefined {
  const {schemaEnv, baseId} = it
  const map = schemaEnv.resourceDynamicAnchors || schemaEnv.root.resourceDynamicAnchors
  return map?.[normalizeId(baseId)]
}

export function hasResourceDynamicAnchors(it: SchemaObjCxt): boolean {
  const anchors = getResourceDynamicAnchors(it)
  return anchors !== undefined && Object.keys(anchors).length > 0
}

export function bindResourceDynamicAnchors(it: SchemaObjCxt): boolean {
  const resourceAnchors = getResourceDynamicAnchors(it)
  if (!resourceAnchors) return false
  const entries = Object.entries(resourceAnchors).filter(
    (e): e is [string, AnySchemaObject] => e[1] !== undefined
  )
  if (entries.length === 0) return false

  const {gen} = it
  const bindings: [string, Code][] = entries.map(([anchor, anchorSchema]) => {
    it.schemaEnv.root.dynamicAnchors[anchor] = true
    return [anchor, resolveDynamicAnchorValidate(it, anchor, anchorSchema)]
  })

  const cond = or(...bindings.map(([anchor]) => _`!${N.dynamicAnchors}${getProperty(anchor)}`))
  gen.if(cond, () => {
    gen.assign(N.dynamicAnchors, _`Object.create(${N.dynamicAnchors} || null)`)
    if (bindings.length === 1) {
      const [anchor, validate] = bindings[0]
      gen.assign(_`${N.dynamicAnchors}${getProperty(anchor)}`, validate)
    } else {
      for (const [anchor, validate] of bindings) {
        const v = _`${N.dynamicAnchors}${getProperty(anchor)}`
        gen.if(_`!${v}`, () => gen.assign(v, validate))
      }
    }
  })
  return true
}

function resolveDynamicAnchorValidate(
  it: SchemaObjCxt,
  anchor: string,
  anchorSchema: AnySchemaObject
): Code {
  const {schemaEnv, baseId, self} = it
  const {root} = schemaEnv
  if (anchorSchema === it.schema && it.errSchemaPath === "#") return it.validateName
  if (anchor === "" && anchorSchema === root.schema) {
    return schemaEnv === root ? it.validateName : getValidate(it, root)
  }
  const ref = anchor === "" ? "#" : `#${anchor}`
  const schOrEnv = resolveRef.call(self, root, baseId, ref)
  if (schOrEnv instanceof SchemaEnv) {
    return schOrEnv === schemaEnv ? it.validateName : getValidate(it, schOrEnv)
  }
  const {localRefs, meta} = root
  const {schemaId} = self.opts
  const sch = new SchemaEnv({
    schema: anchorSchema,
    schemaId,
    root,
    baseId: normalizeId(baseId),
    localRefs,
    meta,
  })
  compileSchema.call(self, sch)
  return getValidate(it, sch)
}

export function dynamicAnchor(cxt: KeywordCxt, anchor: string): void {
  const {gen, it} = cxt
  it.schemaEnv.root.dynamicAnchors[anchor] = true
  // If this anchor belongs to the enclosing resource's dynamic anchor table,
  // it has already been bound at resource entry via bindResourceDynamicAnchors.
  if (getResourceDynamicAnchors(it)?.[anchor] === it.schema) return
  const v = _`${N.dynamicAnchors}${getProperty(anchor)}`
  const validate = it.errSchemaPath === "#" ? it.validateName : _getValidate(cxt)
  gen.if(_`!${v}`, () => {
    gen.assign(N.dynamicAnchors, _`Object.create(${N.dynamicAnchors} || null)`)
    gen.assign(v, validate)
  })
}

function _getValidate(cxt: KeywordCxt): Code {
  const {schemaEnv, schema, baseId, self} = cxt.it
  const {root, localRefs, meta} = schemaEnv.root
  const {schemaId} = self.opts
  const sch = new SchemaEnv({
    schema,
    schemaId,
    root,
    baseId: normalizeId(baseId),
    localRefs,
    meta,
  })
  compileSchema.call(self, sch)
  return getValidate(cxt, sch)
}

export default def
