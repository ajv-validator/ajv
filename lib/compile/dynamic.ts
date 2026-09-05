import type {AnySchema, AnySchemaObject} from "../types"
import {SchemaEnv, compileSchema, SchemaObjCxt} from "."
import {_, Code, getProperty, or, not} from "./codegen"
import N from "./names"
import {isOwnProperty} from "../vocabularies/code"
import {normalizeId} from "./resolve"
import {getValidate} from "../vocabularies/core/ref"

export interface SchemaResource {
  baseId: string
  schema: AnySchemaObject
  anchors: Map<string, AnySchemaObject>
  validators: Map<AnySchema, SchemaEnv>
}

export type ResourceIndex = Map<string, SchemaResource>

export function enterDynamicResource(it: SchemaObjCxt): void {
  const resource = it.schemaEnv.root.resources?.get(normalizeId(it.baseId))
  if (!resource || resource === it.resource) return
  it.resource = resource
  if (!resource.anchors.size) return
  const {gen} = it
  const parent = it.dynamicScope || N.dynamicAnchors
  const scope = gen.let("dynamicScope", parent)
  const missing = [...resource.anchors.keys()].map((anchor) =>
    or(not(isOwnProperty(gen, parent, anchor)), _`${parent}${getProperty(anchor)} === undefined`)
  )
  gen.if(or(...missing), () => {
    gen.assign(scope, _`Object.create(null)`)
    gen.forIn("anchor", parent, (anchor) => {
      gen.if(isOwnProperty(gen, parent, anchor), () => {
        gen.assign(_`${scope}[${anchor}]`, _`${parent}[${anchor}]`)
      })
    })
    for (const [anchor, schema] of resource.anchors) {
      const target = _`${scope}${getProperty(anchor)}`
      gen.if(or(not(isOwnProperty(gen, scope, anchor)), _`${target} === undefined`), () =>
        gen.assign(target, anchorValidator(it, resource, schema))
      )
    }
  })
  it.dynamicScope = scope
}

function anchorValidator(
  it: SchemaObjCxt,
  resource: SchemaResource,
  schema: AnySchemaObject
): Code {
  if (schema.$async) throw new Error("async dynamic anchors are not supported")
  if (schema === it.schemaEnv.schema) return it.validateName
  const env = compileSchema.call(
    it.self,
    new SchemaEnv({
      schema,
      schemaId: it.opts.schemaId,
      root: it.schemaEnv.root,
      baseId: resource.baseId,
      meta: it.schemaEnv.root.meta,
    })
  )
  return getValidate(it.gen, env)
}
